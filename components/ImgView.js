
import React from "react";
import * as THREE from "three";
import OrbitControls from "three-orbitcontrols";

export default class ImgView extends React.Component {

    imgWidth = 0;
    imgHeight = 0;
    dragging = false;
    playerPickLocation = new THREE.Group();

    constructor(props) {
        super(props);
    }

    loadImage() {
        const texture = new THREE.TextureLoader();
        texture.load(this.props.gameState.imgUrl, (texture) => {
            this.imgWidth = texture.image.width;
            this.imgHeight = texture.image.height;
            const imgAspect = this.imgHeight / this.imgWidth;
            const geometry = new THREE.PlaneGeometry(1000, 1000 * imgAspect);
            const material = new THREE.MeshBasicMaterial({ map: texture });
            this.imgMesh = new THREE.Mesh(geometry, material);
            this.imgMesh.name = "img_layer";
            this.scene.add(this.imgMesh);
            const canvas = document.createElement("canvas");
            this.canvasContext = canvas.getContext("2d");
            this.canvasContext.canvas.width = this.imgWidth;
            this.canvasContext.canvas.height = this.imgHeight;
            this.canvasContext.drawImage(texture.image, 0, 0);
        });
    }

    animate() {
        if (this.orbitControls && this.camera) {
            this.orbitControls.update();
            requestAnimationFrame(this.animate.bind(this));
            this.renderer.render(this.scene, this.camera);
        }
    }

    onResize() {
        if (this.camera && this.container && this.container) {
            this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        }
    }

    componentDidMount() {
        this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
        this.renderer.setClearColor(0xffffff, 1);
        this.scene = new THREE.Scene();
        this.raycaster = new THREE.Raycaster();
        window.addEventListener("resize", this.onResize.bind(this));
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.camera = new THREE.PerspectiveCamera(75,
            this.container.offsetWidth / this.container.offsetHeight, 1 / 99, 100000000000000);
        this.camera.position.z = 1000;
        this.orbitControls = new OrbitControls(this.camera, this.container);
        this.orbitControls.maxAzimuthAngle = 0;
        this.orbitControls.minAzimuthAngle = 0;
        this.orbitControls.maxPolarAngle = Math.PI / 2;
        this.orbitControls.minPolarAngle = Math.PI / 2;
        this.orbitControls.screenSpacePanning = true;
        this.container.appendChild(this.renderer.domElement);
        if (this.props.gameState.selectedPlayerIds.indexOf(this.props.myPlayerId) > -1 || 
        this.props.gameState.luckyPlayerId === this.props.myPlayerId) {
            this.container.addEventListener('pointerdown', () => { this.pointerDown = true; });
            this.container.addEventListener('pointermove', this.onPointerMove.bind(this), false);
            this.container.addEventListener('pointerup', this.onPointerUp.bind(this), false);
        }
        this.playerPickLocation = new THREE.Group();
        this.scene.add(this.playerPickLocation);
        this.props.gameState.players.forEach(player => {
            this.addPlayerLocation(player);
        })
        this.loadImage();
        this.animate();
    }

    onPointerUp(event) {
        this.pointerDown = false;
        if (this.dragging) {
            this.dragging = false;
            return;
        }
        const mouse = this.getMouseFromEvent(event);
        const coords = this.getIntersectCoordinates(mouse);
        if (coords) {
            const myPlayer = this.props.gameState.players.filter(p => p.id === this.props.myPlayerId)[0];
            myPlayer.location = coords;
            this.updatePlayerLocation(myPlayer);
            this.props.onUpdate(this.props.gameState);
        }
    }

    getMouseFromEvent(event) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.offsetX / this.container.offsetWidth) * 2 - 1;
        mouse.y = - (event.offsetY / this.container.offsetHeight) * 2 + 1;
        return mouse;
    }

    getIntersectCoordinates(mouse) {
        this.raycaster.setFromCamera(mouse, this.camera);
        let intersects = this.raycaster.intersectObjects(this.scene.children, true);
        const intersect = intersects.filter(i => i.object.name === "img_layer")[0];
        if (intersect) {
            this.updateColorAtCursor(intersect);
            return [intersect.point.x, intersect.point.y];
        } else {
            return undefined;
        }
    }

    updateColorAtCursor(intersect) {
        const texData = this.canvasContext.getImageData(0, 0, this.imgWidth, this.imgHeight);
        const tx = Math.min(this.emod(intersect.uv.x, 1) * texData.width | 0, texData.width - 1);
        let ty = Math.min(this.emod(intersect.uv.y, 1) * texData.height | 0, texData.height - 1);
        ty = texData.height - ty;
        const offset = (ty * texData.width + tx) * 4;
        const r = texData.data[offset + 0];
        const g = texData.data[offset + 1];
        const b = texData.data[offset + 2];
        const rgb = [r, g, b];
        if (this.props.gameState.luckyPlayerId && this.props.gameState.luckyPlayerId === this.props.myPlayerId) {
            this.props.gameState.pickedColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        }
    }

    emod(n, m) {
        return ((n % m) + m) % m;
    }

    addPlayerLocation(player) {
        const url = `/legos/${player.iconNumber}.svg`;
        const texture = new THREE.TextureLoader();
        texture.load(url, (texture) => {
            const geometry = new THREE.PlaneGeometry(100, 100);
            const material = new THREE.MeshBasicMaterial({ map: texture });
            const playerMesh = new THREE.Mesh(geometry, material);
            playerMesh.name = player.iconNumber;
            const coords = player.location;
            playerMesh.position.set(coords[0], coords[1], 10);
            if (player.id === this.props.gameState.luckyPlayerId && 
                this.props.myPlayerId !== this.props.gameState.luckyPlayerId) {
                playerMesh.visible = false;
            }
            this.playerPickLocation.add(playerMesh);
        });
        if (this.allPlayersHaveSelectedLocations()) {
            this.playerPickLocation.children.visible = true;
        }
    }

    updatePlayerLocation(player) {
        const playerLocation = this.playerPickLocation.children.filter(c => c.name === player.iconNumber)[0];
        const coords = player.location;
        playerLocation.position.set(coords[0], coords[1], 10);
        if (this.allPlayersHaveSelectedLocations()) {
            this.playerPickLocation.children.forEach(p => p.visible = true);
        }
    }

    componentWillReceiveProps(nextProps) {
        nextProps.gameState.players.forEach((player) => {
            if (player.id !== this.props.myPlayerId && player.location) {
                if (this.playerPickLocation.children.map(c => c.name).indexOf(player.iconNumber) < 0) {
                    this.addPlayerLocation(player);
                } else {
                    this.updatePlayerLocation(player);
                }
            }
        });
    }

    onPointerMove(event) {
        if (this.pointerDown) {
            this.dragging = true;
        }
    }

    allPlayersHaveSelectedLocations() {
        return this.playerPickLocation.children.length - 1 === this.props.gameState.selectedPlayerIds.length;
    }

    render() {
        return (
            <div style={{ width: "100%", height: "100%" }} ref={container => { this.container = container }}></div>
        );
    }

};