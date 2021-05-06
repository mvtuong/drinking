
import React from "react";
import * as THREE from "three";
import OrbitControls from "three-orbitcontrols";

export default class ImgView extends React.Component {

    imgWidth = 0;
    imgHeight = 0;

    dragging = false;

    constructor(props) {
        super(props);
    }

    loadImage() {
        const texture = new THREE.TextureLoader();
        texture.load(this.props.imgUrl, (texture) => {
            this.imgWidth = texture.image.width;
            this.imgHeight = texture.image.height;
            const imgAspect = this.imgHeight / this.imgWidth;
            const geometry = new THREE.PlaneGeometry(1000, 1000 * imgAspect);
            const material = new THREE.MeshBasicMaterial({ map: texture });
            this.imgMesh = new THREE.Mesh(geometry, material);
            this.imgMesh.name = "img_layer";
            this.scene.add(this.imgMesh);
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
        this.container.addEventListener('pointerdown', () => { this.pointerDown = true; })
        this.container.addEventListener('pointermove', this.onPointerMove.bind(this), false);
        this.container.addEventListener('pointerup', this.onPointerUp.bind(this), false);
        this.userPickLocation = new THREE.Group();
        this.scene.add(this.userPickLocation);
        this.playerPickLocation = new THREE.Group();
        this.scene.add(this.playerPickLocation);
        this.addPlayersPickLocation(this.props.locations);
        this.loadImage();
        this.animate();
    }

    updateUserLocation(userLocation) {
        const markerSize = this.imgWidth / 100;
        if (userLocation.user === "gert") {
            return;
        }
        let extUser = false;
        for (let i = 0; i < this.scene.children.length; i++) {
            const child = this.scene.children[i];
            if (child.name === userLocation.user) {
                child.position.set(userLocation.x, userLocation.y, 0);
                extUser = true;
                break;
            }
        }
        if (!extUser) {
            const group = new THREE.Group();
            group.name = userLocation.user;
            group.position.set(userLocation.x, userLocation.y, 10);
            const material = new THREE.MeshBasicMaterial({ color: "white" });
            const geometry = new THREE.SphereGeometry(markerSize, 50, 50);
            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);
            const loader = new THREE.FontLoader();
            loader.load('optimer_bold.typeface.json', (font) => {
                const geometry = new THREE.TextGeometry(userLocation.user, {
                    font: font,
                    size: 20,
                    height: 1
                });
                const textMest = new THREE.Mesh(geometry, material);
                group.add(textMest);
            });
            this.scene.add(group);
        }
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
            this.addUserPickLocation(coords);
            if (this.props.onPointerUp) {
                this.props.onPointerUp(coords);
            }
        }
    }

    onPointerMove(event) {
        if (this.pointerDown) {
            this.dragging = true;
        }
        const mouse = this.getMouseFromEvent(event);
        if (!this.oldMouse) {
            this.oldMouse = mouse;
        }
        const mouseMoveDist = Math.abs(mouse.distanceTo(this.oldMouse));
        if (mouseMoveDist <= 0) {
            return;
        }
        const coords = this.getIntersectCoordinates(mouse);
        if (coords) {
            const userLocation = {
                user: "gert",
                x: coords[0],
                y: coords[1]
            };
            if (this.props.onPointerMove) {
                this.props.onPointerMove(userLocation);
            }
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
            return [intersect.point.x, intersect.point.y];
        } else {
            return undefined;
        }
    }

    addUserPickLocation(coords) {
        this.userPickLocation.clear();
        this.userPickLocation.position.set(coords[0], coords[1], 10);
        const geometry = new THREE.RingGeometry(30, 40, 32);
        const material = new THREE.MeshBasicMaterial({ color: "white" });
        const circle = new THREE.Mesh(geometry, material);
        this.userPickLocation.add(circle);
    }

    addPlayersPickLocation(coordPairs) {
        this.playerPickLocation.clear();
        coordPairs.forEach((coords) => {
            if (coords) {
                const geometry = new THREE.RingGeometry(30, 40, 32);
                const material = new THREE.MeshBasicMaterial({ color: "blue" });
                const circle = new THREE.Mesh(geometry, material);
                circle.position.set(coords[0], coords[1], 10);
                this.playerPickLocation.add(circle);
            }
        });
    }

    componentWillReceiveProps(nextProps) {
        this.addPlayersPickLocation(nextProps.locations);
    }


    render() {
        return (
            <div style={{ width: "100%", height: "100%" }} ref={container => { this.container = container }}></div>
        );
    }

};