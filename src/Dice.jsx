import * as THREE from "three";
import * as CANNON from "cannon";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

export const Dice = () => {
  const [items, setItems] = useState(localStorage.getItem("items") ? 
    JSON.parse(localStorage.getItem("items"))
  :
    {
      pink: "はじめて〇〇した話",
      sky: "悲しい話",
      orange: "一番役に立ったこと",
      purple: "情けない話",
      green: "ちょっとハマってる話",
      yellow: "当たり!!",
    }
  );
  const { register, handleSubmit } = useForm();
  const onSubmit = data => {
    console.log(data)
    localStorage.setItem("items", JSON.stringify(data))
  };

  const W_WIDTH  = window.innerWidth;
  const W_HEIGHT = window.innerHeight;
  const W_ASPECT = window.innerWidth / window.innerHeight;
  const W_RATIO  = window.devicePixelRatio;
  let camera, scene, renderer, cube;
  let world = null;
  let phyPlane = null;
  let phyBox = null;
  let div = null;

  function init() {
    setPhy();
    setView();
    const id = animate();
    setTimeout(() => {
      cancelAnimationFrame(id);
    }, 10000);
  }

  function setView () {
    scene = new THREE.Scene();

    scene.fog = new THREE.Fog(0x000000, 1, 100);
    camera = new THREE.PerspectiveCamera(30, W_ASPECT, 1, 10000);
    camera.position.set(Math.cos(Math.PI / 30) * 8, 20, Math.sin(Math.PI / 30) * 8);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    let light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(10, 10, 10);
    light.castShadow = true;
    light.shadow.mapSize.Width = 1024;
    light.shadow.mapSize.Height = 1024;
    light.shadow.camera.Left = -10;
    light.shadow.camera.Right = 10;
    light.shadow.camera.Top = 10;
    light.shadow.camera.Bottom = -10;
    light.shadow.camera.Far = 10;
    light.shadow.camera.Near = 0;
    scene.add(light);
    let amb = new THREE.AmbientLight(0xffffff);
    scene.add(amb);

    let geometryCube = new THREE.BoxGeometry(2, 2, 2);
    let materialColors = [
      new THREE.MeshBasicMaterial({map: setTexture(items["pink"], "#fca9f6"), color: 0xfca9f6, side: THREE.DoubleSide}),
      new THREE.MeshBasicMaterial({map: setTexture(items["sky"], "#a9f0fc"), color: 0xa9f0fc, side: THREE.DoubleSide}),
      new THREE.MeshBasicMaterial({map: setTexture(items["orange"], "#fcd8a9"), color: 0xfcd8a9, side: THREE.DoubleSide}),
      new THREE.MeshBasicMaterial({map: setTexture(items["purple"], "#d096ff"), color: 0xd096ff, side: THREE.DoubleSide}),
      new THREE.MeshBasicMaterial({map: setTexture(items["green"], "#befca9"), color: 0xbefca9, side: THREE.DoubleSide}),
      new THREE.MeshBasicMaterial({map: setTexture(items["yellow"], "#fcf3a9"), color: 0xfcf3a9, side: THREE.DoubleSide})
    ];
    cube = new THREE.Mesh(geometryCube, materialColors);
    cube.position.y = 1;
    scene.add(cube);
    let viewPlane = new THREE.Mesh(new THREE.CircleGeometry(10, 128), new THREE.MeshPhongMaterial({color: 0xeb3f3f}));
    viewPlane.rotation.x = -Math.PI / 2;
    viewPlane.position.y = 1 / 20;
    viewPlane.receiveShadow = true;
    scene.add(viewPlane);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(W_WIDTH, W_HEIGHT);
    renderer.setPixelRatio(W_RATIO);
    renderer.setClearColor(0x000000, 1);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(W_RATIO);
    div = document.getElementById("three");
    div.appendChild(renderer.domElement);
    renderer.render(scene, camera);
    setRenderer(renderer);
  }

  function setPhy() {
    world = new CANNON.World();
    world.gravity.set(0, -(Math.random() + 9), 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    world.solver.tolerance = 0.1;

    phyPlane = new CANNON.Body({mass: 0});
    phyPlane.name = "base";
    phyPlane.addShape(new CANNON.Plane());
    phyPlane.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.add(phyPlane);

    phyBox = new CANNON.Body({mass: 1});
    phyBox.addShape(new CANNON.Box(new CANNON.Vec3(1, 1, 1)));
    phyBox.position.y = 10;
    phyBox.angularVelocity.set(10, 10, 10);
    phyBox.angularDamping = 0.1;
    world.add(phyBox);
    let mat = new CANNON.ContactMaterial(phyPlane, phyBox, { friction: 0.01, restitution: 0});
    world.addContactMaterial(mat);
  }

  function setTexture (item, color) {
    let canvas = document.createElement( 'canvas' );
    let context = canvas.getContext( '2d' );
    context.width = 512;
    context.height = 128;

    context.beginPath();
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);  
    context.beginPath();
    context.fillStyle = '#000000';
    context.font = 'bold 30px ヒラギノ丸ゴ Pro W4, ヒラギノ丸ゴ Pro, Hiragino Maru Gothic Pro, ヒラギノ角ゴ Pro W3, Hiragino Kaku Gothic Pro, HG丸ｺﾞｼｯｸM-PRO, HGMaruGothicMPRO';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(item, 148, 70, 230);
    context.fill();

    let texture = new THREE.Texture( canvas );
    texture.needsUpdate = true;
    return texture;
  }

  function animate() {
    cube.rotation.x += Math.random();
    cube.rotation.y += Math.random();
    cube.rotation.z += Math.random();
    world.step(1 / 60);
    cube.position.copy(phyBox.position);
    cube.quaternion.copy(phyBox.quaternion);
    camera.lookAt(cube.position);
    const id = requestAnimationFrame(animate);
    renderer.render(scene, camera);
    setRequestId(id);
    return id;
  }

  useEffect(() => {
    const stateItems = localStorage.getItem("items");
    if(stateItems) {
      setItems(JSON.parse(stateItems));
    } else {
      setItems({
        pink: "はじめて〇〇した話",
        sky: "悲しい話",
        orange: "一番役に立ったこと",
        purple: "情けない話",
        green: "ちょっとハマってる話",
        yellow: "当たり!!",
      })
    }
    init();
  }, [])

  return (
    <>
      <div id="three">
        <div id="side" className="p-5">
          <h2 className="title">Saicoro Talk 3D</h2>
          <form onChange={handleSubmit(onSubmit)}>
            <div className="flex flex-col bg-slate-500 p-2 rounded-md my-2">
              <label className="flex flex-row items-center mb-1">
                <span className="icon pink mr-1"></span>
                Pink
              </label>
              <input type="text" defaultValue={items["pink"]} {...register("pink")} />
            </div>
            <div className="flex flex-col bg-slate-500 p-2 rounded-md my-2">
              <label className="flex flex-row items-center mb-1">
                <span className="icon sky mr-1"></span>
                Sky
              </label>
              <input type="text" defaultValue={items["sky"]} {...register("sky")} />
            </div>
            <div className="flex flex-col bg-slate-500 p-2 rounded-md my-2">
              <label className="flex flex-row items-center mb-1">
                <span className="icon orange mr-1"></span>
                Orange
              </label>
              <input type="text" defaultValue={items["orange"]} {...register("orange")} />
            </div>
            <div className="flex flex-col bg-slate-500 p-2 rounded-md my-2">
              <label className="flex flex-row items-center mb-1">
                <span className="icon purple mr-1"></span>
                Purple
              </label>
              <input type="text" defaultValue={items["purple"]} {...register("purple")} />
            </div>
            <div className="flex flex-col bg-slate-500 p-2 rounded-md my-2">
              <label className="flex flex-row items-center mb-1">
                <span className="icon green mr-1"></span>
                Green
              </label>
              <input type="text" defaultValue={items["green"]} {...register("green")} />
            </div>
            <div className="flex flex-col bg-slate-500 p-2 rounded-md my-2">
              <label className="flex flex-row items-center mb-1">
                <span className="icon yellow mr-1"></span>
                Yellow
              </label>
              <input type="text" defaultValue={items["yellow"]} {...register("yellow")} />
            </div>
          </form>
          <a href="/">
            <button type="button" className="w-full p-2 bg-red-600 text-white rounded-md ">転がす</button>
          </a>
        </div>
      </div>
    </>
  )

}
