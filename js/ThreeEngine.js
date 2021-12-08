/*   _     _   _     
    | |___| |_| |__
    | / _ \  _|    |
    |_\___/\__|_||_|
    http://3dflashlo.wordpress.com/
*/

var ThreeEngine = function () {
	'use strict';
	// containe background object
	var back = new THREE.Object3D();
	// containe all object from simulation
	var content = new THREE.Object3D();
	// containe object from drag and shoot
	var contentPlus = new THREE.Object3D();
	// containe all static object from simulation
	var contentDebug = new THREE.Object3D();
	// containe all joint object from simulation
	var contentJoint = new THREE.Object3D();
	// containe special object
	var contentSpecial = new THREE.Object3D();

	// containe all material reference
	var materials = [];

	var renderer, scene, sceneSky, camera, cameraSky, sky, materialSky, renderLoop, control;

	var vsize = { x:0, y:0, z:0};
	var vmid = { x:1, y:1, mode:'no' };
	var camPos = { horizontal: 40, vertical: 60, distance: 2000, automove: false, phi:0, theta:0 };
	var mouse = { ox:0, oy:0, h:0, v:0, mx:0, my:0, down:false, over:false, moving:true };
	var center = new THREE.Vector3(0,150,0);

	var delta, clock = new THREE.Clock();
	var fpstxt, time, time_prev = 0, fps = 0, startTime, ms;

	var meshs = [];
	var bullets = [];
	//var players = [];

	var currentPlay;
	var character=0;
	var currentPlayer = 1;
	var controls = { rotation: 0, speed: 0, vx: 0, vz: 0, maxSpeed: 275, acceleration: 600, angularSpeed: 2.5};

	var isLoading = true;
	var antialias;
	var MaxAnistropy;

	var raycaster = new THREE.Raycaster();
	var projector = new THREE.Projector();
	var directionVector = new THREE.Vector3();
	var marker, markerMaterial;

	var PATH = 'http://lo-th.github.io/Oimo.js/';

	var unselect = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none;';

	var container = document.createElement( 'div' );
	container.id = 'container';
	container.style.cssText = unselect + 'padding:0; position:absolute; left:0; top:0; bottom:0; overflow:hidden;';

	var selectedCenter = new THREE.Vector3(0,150,0);
	var selected = null;
	var point = null;
	var followObject = null;
	var followSpecial = null;
	var player = null;

	var isBuffered = false;
	var isDebug = true;

	var materialType=0;
	var isShadow = false;
	var isReflect = true;
	

	var planeBG = null;



	var isOptimized;

	var mouseMode = '';
	//var backPlane;


	var debugColor = 0x282929;
	var debugColor2 = 0x288829;
	var debugAlpha = 0.3;
	var jointColor = 0x30ff30;


	//-----------------------------------------------------
	//  INIT VIEW
	//-----------------------------------------------------

	var init = function () {

		// for my local test on windows explorer
		if(browserName==="Firefox" || browserName==="Chrome") PATH = '';

		renderer = new THREE.WebGLRenderer({precision: "mediump", antialias:false, clearColor: 0x000000, clearAlpha: 0 });
		renderer.autoClearColor = false;
		
		container.appendChild( renderer.domElement );

		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera( 60, 1, 1, 20000 );
		scene.add(camera);

		sceneSky = new THREE.Scene();
		cameraSky = new THREE.PerspectiveCamera( 60, 1, 1, 999999 );
		sceneSky.add(cameraSky);

		materialSky = new THREE.MeshBasicMaterial( { map:basicSky() , depthWrite: false} );// side:THREE.BackSide,
		//sky = new THREE.Mesh(new THREE.IcosahedronGeometry(20000,1), materialSky);
		sky = new THREE.Mesh(new THREE.SphereGeometry(20000, 20, 12), materialSky);
		sky.rotation.y = 180*ToRad;
		sky.scale.set(1,1,-1)
		
		sceneSky.add(sky);
		

        scene.add(back);
		scene.add(content);
		scene.add(contentPlus);
		scene.add(contentDebug);
		scene.add(contentJoint);
		scene.add(contentSpecial);

		//addControl();

		// marker for mouse position
		markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
		marker = new THREE.Mesh(new THREE.SphereGeometry(6), markerMaterial);
		scene.add(marker);

		initLights();

		MaxAnistropy = renderer.getMaxAnisotropy();
		if(isReflect) initReflectBall();
		initMaterial();

		groundMaterial = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, transparent:true, opacity:0.5, blending:THREE.MultiplyBlending} );
		planeBG = new THREE.Mesh( new THREE.PlaneGeometry( 8000,8000 ), groundMaterial );
		planeBG.rotation.x = -90*ToRad;
		planeBG.position.y = 0.01;
		planeBG.receiveShadow = true;
		back.add(planeBG);
		planeBG.name = 'ground';
		planeBG.visible = false;

		initSea3DMesh();
		moveCamera();
		
	    changeView(45,60,1000);
	    initListener();
	    
	    //initBackPlane();
	    update();
	}

	/*var initBackPlane = function () {
		var backMat = new THREE.MeshBasicMaterial( { color: 0x905050, wireframe:true} );
		backPlane = new THREE.Mesh( new THREE.PlaneGeometry( 2000,2000, 4, 4 ), backMat );
		backPlane.receiveShadow = true;
		backPlane.castShadow = false;
		contentPlus.add(backPlane);
	}

	var updateBackPlane = function () {
		if(backPlane){
			backPlane.position.copy(selectedCenter);
			backPlane.rotation.y = -camPos.theta-(90*ToRad);
		}
	}*/

	var initListener = function () {
		container.addEventListener( 'mousemove', onMouseMove, false );
		container.addEventListener( 'mousedown', onMouseDown, false );
		container.addEventListener( 'mouseout', onMouseUp, false );
		container.addEventListener( 'mouseup', onMouseUp, false );

		container.addEventListener( 'touchmove', onTouchMove, false );
		container.addEventListener( 'touchstart', onTouchStart, false);
		container.addEventListener( 'touchcancel', onMouseUp, false);
		container.addEventListener( 'touchend', onMouseUp, false);

		container.addEventListener( 'mousewheel', onMouseWheel, false );
		container.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

		document.addEventListener( 'keydown', onKeyDown, false );
		document.addEventListener( 'keyup', onKeyUp, false );

		window.addEventListener( 'resize', viewResize, false ); 
		viewResize();
	}

	var basicSky = function (n){
        var canvas = document.createElement( 'canvas' );
        canvas.width = canvas.height = 128;
        var ctx = canvas.getContext( '2d' );
        var colors = [];

        colors[0] = "#2a2a2a";
        colors[1] = "#2a2a2a";
        colors[2] = "#1a1a1a";
        colors[3] = "#1a1a1a";
        colors[4] = "#1a1a1a";
        var grd=ctx.createLinearGradient(0,0,0,128);
        grd.addColorStop(0.1,colors[0]);
        grd.addColorStop(0.5,colors[1]);
        grd.addColorStop(0.55,colors[2]);
        grd.addColorStop(0.7,colors[3]);
        grd.addColorStop(0.9,colors[4]);
        
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 128, 128);

        var tx = new THREE.Texture(canvas);
        tx.needsUpdate = true;
        return tx;
    }

	//-----------------------------------------------------
	//  MESH CONTROL TEST
	//-----------------------------------------------------
	
	/*var addControl = function(){
		control = new THREE.TransformControls( camera, renderer.domElement );
		scene.add( control );
		//control.addEventListener( 'change', render );
	}

	var attachControl = function(mesh){
		if(control) control.attach( mesh );
	}*/
	
	//-----------------------------------------------------
	//  OPTION ON/OFF
	//-----------------------------------------------------
	
	var reflection = function(){
		if(!isReflect){
			isReflect = true;
			initReflectBall();
			updateBallCamera();
			activReflection();
		} else {
			isReflect = false;
			removeReflection();
			if(ballCamera){
				ballScene.remove( ballCamera );
				ballScene.remove( ball );
				//ballScene = null;
			}
		}
		/*var i=materials.length;//content.children.length;
		while (i--) {
			//content.children[ i ].material.needsUpdate = true;
			materials[ i ].needsUpdate = true;
		}*/


	}

	var debug = function(){
		if(isDebug)isDebug = false;
		else isDebug = true;
		var i=contentDebug.children.length;
		while (i--) contentDebug.children[ i ].visible = isDebug;
	}

	var shadow = function(){
		if(isShadow){
			isShadow = false;
		}else{ 
			isShadow = true;
		}

		renderer.shadowMapEnabled = isShadow;
		lights[1].castShadow = isShadow;
		planeBG.visible = isShadow;
		planeBG.material.needsUpdate = true;

		var i=materials.length;
		while (i--) {
			materials[ i ].needsUpdate = true;
		}
	}

	var changeMaterialType = function(){
		materialType++;
		if(materialType==3)materialType=0;

		baseMaterial();

		var i=materials.length;
		while (i--) {
			materials[ i ].needsUpdate = true;
		}
		i=content.children.length;
		var name;
		while (i--) {
			if(content.children[ i ].material){
				name = content.children[ i ].material.name;
				content.children[ i ].material = getMaterial(name);
				content.children[ i ].material.needsUpdate = true;
		    }
		}
		if(isReflect){
			activReflection();
		}
	}

	//-----------------------------------------------------
	//  REFLECT BALL
	//-----------------------------------------------------

	var ballScene, ballCamera, ball, ballMaterial, envtexture;

	var initReflectBall = function(){
		var s = 1;
		ballScene = new THREE.Scene();

		ballCamera = new THREE.CubeCamera( s*0.5, s*1.2, 256 );
		ballCamera.position.set(0,0,0);
		ballCamera.lookAt( new THREE.Vector3(0,0,5));
		ballScene.add( ballCamera );

		ballMaterial = new THREE.MeshBasicMaterial({  });
		ball = new THREE.Mesh( new THREE.SphereGeometry( 1, 20, 12  ),  ballMaterial);
		//ball.castShadow = false;
		//ball.receiveShadow = false;
		ball.scale.set(-s,s,s);
		ballScene.add( ball );

		//updateBallCamera();
	}

	var updateBallCamera = function (){
		if(ballCamera){
			ballMaterial.map = Ambience.getTexture();
			ballMaterial.map.anisotropy = MaxAnistropy;
			ballMaterial.map.needsUpdate = true;

			if(isReflect){
				materialSky.map = Ambience.getTexture();
				materialSky.map.needsUpdate = true;
			}

			//if(!isOptimized)renderer.shadowMapEnabled = false;
			ballCamera.updateCubeMap( renderer, ballScene );
			//if(!isOptimized)renderer.shadowMapEnabled = true;
		}
	}

	var activReflection = function (){ 
		envtexture = ballCamera.renderTarget;
		var i = materials.length;
		while (i--) {
			materials[i].envMap = envtexture;
			materials[i].combine = THREE.MixOperation;
			//materials[i].combine = THREE.MultiplyOperation;
			materials[i].reflectivity = 0.5;
			materials[i].refractionRatio = 0.98;
			materials[i].needsUpdate = true;
		}
	}

	var removeReflection = function (){
		var i = materials.length;

		materialSky.map = new nullTexture();
		materialSky.map.needsUpdate = true;

		while (i--) {
			materials[i].envMap = null;
			materials[i].combine = null;
			//materials[i].combine = THREE.MultiplyOperation;
			materials[i].reflectivity = 0;
			materials[i].needsUpdate = true;
		}
	}

	//-----------------------------------------------------
	//  MATERIAL
	//-----------------------------------------------------

	var debugMaterial, jointMaterial;
	var envTexture;
	var groundMaterial;

	

	var textures = [];
	var bTextures = [];
	var poolTextures = [];

	var initMaterial = function () {

		textures[0] = new createDiceTexture(0);
		textures[1] = new createDiceTexture(1);
		textures[2] = new createSnakeTexture();
		textures[3] = new createWheelTexture(0);
		textures[4] = new createGyroTexture();
		textures[5] = new createDroidTexture();

		bTextures[0] = new basicTexture(0);
		bTextures[1] = new basicTexture(1);
		bTextures[2] = new basicTexture(2);
		bTextures[3] = new basicTexture(3);
		bTextures[4] = new basicTexture(4);
		bTextures[5] = new basicTexture(5);
		bTextures[6] = new basicTexture(6);
		bTextures[7] = new basicTexture(7);

		for(var i=0; i!==16; i++){
			poolTextures[i] = new eightBall(i);
		}

		debugMaterial = new THREE.MeshBasicMaterial( { color:debugColor, wireframe:true, transparent:true, opacity:debugAlpha} );
		jointMaterial = new THREE.LineBasicMaterial( { color: jointColor } );
		
		baseMaterial();

		if(isReflect){
			activReflection();
			updateBallCamera();
		}
	}

	var baseMaterial = function (){
		makeMaterial( { n:0, map: bTextures[2], name:'mat01' } );//0
		makeMaterial( { n:1, map: bTextures[0], name:'mat02'} );//1
		makeMaterial( { n:2, map: bTextures[4], name:'mat03' } );//2
		makeMaterial( { n:3, map: textures[0], name:'mat04' } );//3
		makeMaterial( { n:4, map: textures[2], skinning: true, transparent:true, opacity:0.9, name:'mat05' } ); //4
		makeMaterial( { n:5, map: textures[3], name:'mat06' } );//5
		makeMaterial( { n:6, map: bTextures[6], name:'mat07' } );//6
		makeMaterial( { n:7, color: 0xe7b37a, skinning: true, transparent:true, opacity:0.5, name:'mat08' } );
		makeMaterial( { n:8, map: bTextures[3], name:'mat01sleep' } );//8
		makeMaterial( { n:9, map: bTextures[1], name:'mat02sleep' } );//9
		makeMaterial( { n:10, map: bTextures[5], name:'mat03sleep' } );//10
		makeMaterial( { n:11, map: textures[1], name:'mat04sleep' } );//11
		makeMaterial( { n:12, map: bTextures[7], name:'mat07sleep' } );//12
		makeMaterial( { n:13, map: textures[4], name:'matGyro' } );//13
		makeMaterial( { n:14, map: textures[5], skinning: true, name:'matDroid' } );//14

		for(var i=0; i!==16; i++){
			makeMaterial( { n:15+i, map: poolTextures[i], shininess:60, specular:0xffffff, name:'pool'+i } );
		}
	}

	var makeMaterial = function (obj){
		var mat;
		switch(materialType){
			case 0:
			    mat = new THREE.MeshBasicMaterial( obj );
			break;
			case 1:
				obj.shininess = 100;
				obj.specular = 0xffffff;
			    mat = new THREE.MeshLambertMaterial( obj );
			break;
			case 2:
			    obj.shininess = 100;
				obj.specular = 0xffffff;
			    mat = new THREE.MeshPhongMaterial( obj );
			break;
		}

		materials[obj.n] = mat;
	}

	var getMaterial = function (name){
		var mat;
		for(var i=0;i!==materials.length; i++){
			if(materials[i].name === name) mat = materials[i];
		}
		return mat;
	}

	

	//-----------------------------------------------------
	//  CROSSED OIMO FUNCTIONS
	//-----------------------------------------------------

	var ADD = function (obj){
		var name = obj.name || "";
		var mesh;
		var type = obj.type || "box";
		var move = obj.move || false;
		var size = obj.size || [100,100,100];
		var pos = obj.pos || [0,0,0];
		var r = obj.rot || [0,0,0];
		var rot = rotationToRad(r);
		var notSleep = obj.notSleep || false;
		// phy config: [ density, friction, restitution, belongsTo, collidesWith]
		//var config = obj.config || [1, 0.4, 0.2, 1, 0xffffffff];//option
		var config = obj.config || [1, 0.4, 0.2];

		// joint
		var body1 = obj.body1 || null;
		var body2 = obj.body2 || null;
		var pos1 = obj.pos1 || [0,0,0];
		var pos2 = obj.pos2 || [0,0,0];
		var axis1 = obj.axis1 || [0,0,0];
		var axis2 = obj.axis2 || [0,0,0];
		var minDistance = obj.min || 1;
		var maxDistance = obj.max || 10;
		var collision = obj.collision || false;
		var spring = obj.spring || [1, 0.5];
		var upperAngle = obj.upperAngle || 0;
		
		if(type.substring(0,5) === 'joint'){//_____________________________ Joint
			addJoint();
			OimoWorker.postMessage({ tell:"ADD", name:name, type:type, body1:body1, body2:body2, pos1:pos1, pos2:pos2, axis1:axis1, axis2:axis2, collision:collision, minDistance:minDistance, maxDistance:maxDistance, spring:spring, upperAngle:upperAngle   });
		}else{
			if(move){//_____________________________________ Dynamic
				addObjects( type, size );
			}else{//____________________________________________ Static
				mesh = addStaticObjects( type, size );
				mesh.position.set( pos[0], pos[1], pos[2] );
				mesh.rotation.set( rot[0], rot[1], rot[2] );
			}
			// now create in oimo physic
			OimoWorker.postMessage({ tell:"ADD", name:name, type:type, move:move, size:size, pos:pos, rot:rot, config:config, notSleep:notSleep });
		}
	}

	var CONTROL = function(data){
		var type = obj.type || "ball";
	    var pos = obj.pos || [0,0,0];
	    switch(data.type){
	        case 'car': 
	        break;
	        case 'van': 
	        break;
	        case 'ball': 
	        break;
	        case 'droid':
	        break;
	    }
	    OimoWorker.postMessage({ tell:"CONTROL", type:type, pos:pos, config:config });
	}

	var REMOVE = function (obj){
	}

	var rotationToRad = function (ar){
	    return [ar[0]*ToRad, ar[1]*ToRad, ar[2]*ToRad];
	}

	//-----------------------------------------------------
	//  PHYSICS JOINT OBJECT IN THREE
	//-----------------------------------------------------

	var createJoints = function (n){
		for(var i=0; i!==n; i++){
			addJoint();
		}
	}

	var addJoint = function (){
		var joint;
		var geo = new THREE.Geometry();
		geo.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
		geo.vertices.push( new THREE.Vector3( 0, 10, 0 ) );
		joint = new THREE.Line( geo, jointMaterial, THREE.LinePieces );
		contentJoint.add( joint );
		return joint;
	}

	//-----------------------------------------------------
	//  PHYSICS STATIC OBJECT IN THREE
	//-----------------------------------------------------

	var createStaticObjects = function (data){
		var max = data.types.length;
		var mesh;
		var m, mtx;
	    for(var i=0; i!==max; i++){
	    	mesh = addStaticObjects(data.types[i], data.sizes[i] || [50,50,50]);
	        m = data.matrix[i];
	        mtx = new THREE.Matrix4(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11], 0, 0, 0, 1);
	        mesh.position.setFromMatrixPosition( mtx );
	        mesh.rotation.setFromRotationMatrix( mtx );
	    }
	}

	//var staticColor = 

	var addStaticObjects = function (type, s){
		var mesh;
		var helper, helper2;
		switch(type){
		    case 1: case 'sphere': mesh=new THREE.Mesh(geo05, debugMaterial); mesh.scale.set( s[0], s[0], s[0] ); break; // sphere
		    case 2: case 'box': 
		        mesh=new THREE.Mesh(geo01, debugMaterial);
		        mesh.scale.set( s[0], s[1], s[2] );
		        mesh.visible = false;
		        //mesh=new THREE.Mesh(new THREE.CubeGeometry( s[0], s[1], s[2] ), debugMaterial);
                helper = new THREE.BoxHelper(mesh);
                helper.material.color.set( debugColor );
                helper.material.opacity = debugAlpha;
                helper.material.transparent = true;
		        mesh.add( helper );
		    break; // box
		    case 22: case 'ground': 
		        mesh=new THREE.Mesh(geo01, debugMaterial);
		        mesh.scale.set( s[0], s[1], s[2] );
		        mesh.visible = false;
		        //mesh=new THREE.Mesh(new THREE.CubeGeometry( s[0], s[1], s[2] ), debugMaterial);
                helper = new THREE.BoxHelper(mesh);
                helper.material.color.setHex( debugColor );
                helper.material.opacity = debugAlpha;
                helper.material.transparent = true;
                //helper.material.fog = false;;
                mesh.add( helper );
		        
		        helper2 = new THREE.GridHelper( 0.5, 0.0625 );
				helper2.setColors( debugColor2, debugColor );
				helper2.material.opacity = debugAlpha;
                helper2.material.transparent = true;
				helper2.position.y = 0.5;
				mesh.add( helper2 );
		    break; // box
	    }
	    mesh.receiveShadow = false;
	    mesh.castShadow = false;
	    mesh.name = 'D'+contentDebug.children.length;
	    contentDebug.add( mesh );
	    if(!isDebug) mesh.visible = false;
	    return mesh;
	}

	//-----------------------------------------------------
	//  PHYSICS OBJECT IN THREE
	//-----------------------------------------------------

	var boneindex=0;

	var createObjects = function (data){
		boneindex=0;
		var max = data.types.length;

	    for(var i=0; i!==max; i++){
	    	addObjects(data.types[i], data.sizes[i] || [50,50,50]);
	    }

	    if(data.demo === 3) addSnake();
	    if(data.demo === 6) addSila();

	    // reset camera position
	    cameraFollow(new THREE.Vector3(0,150,0));
	}

	var addObjects = function (type, s){
		var name = content.children.length;
		var mesh;
		var m2 = null;
		var m3 = null;
		var meshFlag;

    	switch(type){
    		case 1: case 'sphere': mesh=new THREE.Mesh(geo02b, getMaterial('mat02')); mesh.scale.set( s[0], s[0], s[0] ); break; // sphere
    		case 2: case 'box':
    		    mesh=new THREE.Mesh(smoothCube, getMaterial('mat01'));
    		    //mesh=new THREE.Mesh(geo01b, getMaterial('mat01'));
    		    mesh.scale.set( s[0], s[1], s[2] ); 
    		break; // box
    		case 3: case 'cylinder': mesh=new THREE.Mesh(geo03b, getMaterial('mat03')); mesh.scale.set( s[0], s[1], s[2] ); break; // Cylinder

    		case 4: case 'dice': mesh=new THREE.Mesh(diceBuffer, getMaterial('mat04')); mesh.scale.set( s[0], s[1], s[2] ); break; // dice
    		case 5: case 'wheel':
    		    mesh=new THREE.Mesh(getSeaGeometry('wheel'), getMaterial('mat06'));
    		    mesh.scale.set( s[0]*2, s[1]*2, s[2]*2 );
    		break;
    		case 6: case 'wheelinv':
    		    mesh=new THREE.Mesh(getMeshByName('wheel').geometry, getMaterial('mat06'));
    		    mesh.scale.set( -s[0]*2, s[1]*2, -s[2]*2 );
    		break;

    		case 7: case 'column': mesh=new THREE.Mesh(colomnBuffer, getMaterial('mat07')); mesh.scale.set( s[1], s[1], s[1] ); break;
    		case 8: case 'columnBase': mesh=new THREE.Mesh(colomnBaseBuffer, getMaterial('mat07')); mesh.scale.set( s[1], s[1], s[1] ); break;
    		case 9: case 'columnTop': mesh=new THREE.Mesh(colomnTopBuffer, getMaterial('mat07')); mesh.scale.set( s[1], s[1], s[1] ); break;

    		case 10: case 'bone':
    		    mesh = new THREE.Object3D();
    		    var Bmat = new THREE.MeshBasicMaterial( { map: bonesFlag(boneindex), side:THREE.DoubleSide } );
    		    meshFlag=new THREE.Mesh(geo00, Bmat ); 
    		    mesh.scale.set( s[0], s[1], s[2] ); 
    		    mesh.add(meshFlag);
    		    boneindex++;
    		break;
    		case 11: case 'nball': 
    		    mesh = new THREE.Mesh(geo04b, getMaterial('pool'+Math.floor((Math.random()*16))) ); 
    		    mesh.scale.set( s[0], s[0], s[0] ); 
    		break;
    		case 12: case 'gyro':
	    		mesh = new THREE.Object3D();
	    		m2 = getMeshByName('gyro');
	    		m2.material = getMaterial('matGyro');
	    		m2.children[0].material = getMaterial('matGyro');
	    		m2.children[0].children[0].material = getMaterial('matGyro');
	    		m2.children[0].children[0].children[0].material = getMaterial('matGyro');
	    		m2.scale.set( s[0], s[0], s[0] );
	    		contentSpecial.add(m2);
	    		followSpecial = "gyro";
	    		followObject = mesh;//name;
    		break;
    		case 13: case 'carBody':
    		    mesh = new THREE.Mesh(getMeshByName('carBody').geometry, getMaterial('mat02')); 
    		    mesh.scale.set( 100, 100, 100 );

    		    followObject = mesh;//name;
    		break;
    		case 14: case 'vanBody':
    		    mesh = new THREE.Object3D();
    		    m2 = getMeshByName('vanBody');
    		    m2.material = getMaterial('mat02');
    		    m2.children[0].material = getMaterial('mat02');
    		    m2.children[1].material = getMaterial('mat02');
    		    m2.children[2].material = getMaterial('mat02');
    		    m2.scale.set( 3, 3, 3 );
    		    m2.position.y= -36;
    		    mesh.add(m2);
    		    followObject = mesh;//name;
    		break;
    		case 15: case 'vanwheel':
    		    mesh = new THREE.Mesh(getMeshByName('vanWheel').geometry, getMaterial('mat03'));
    		    mesh.scale.set( 3, 3, 3 );
    		break;
    		case 16: case 'droid':
    		    mesh = new THREE.Object3D();
    		    //mesh=new THREE.Mesh(smoothCube, getMaterial('mat01'));
    		    //mesh.scale.set( s[0], s[1], s[2] );
    		    //mesh=new THREE.Mesh(geo02b, getMaterial('mat02'));
    		    //mesh.scale.set( s[0], s[0], s[0] ); 

    		    player = new THREE.Object3D();
    		    m2 = getMeshByName('Android');

    		    m2.scale.set( 1, 1, -1 );
    		    //m2.position.set(0,-10,0);

    		    m2.material = getMaterial('matDroid');
    		   
    		    m2.play("Idle");
    		    m2.rotation.y = -90*ToRad;
    		    player.add(m2);
    		    player.scale.set( 2,2, 2 );
    		    //m2.position.y=30;
    		    contentSpecial.add(player);
	    		followSpecial = "droid";
	    		//player = m3;
	    		//player.position.set(0,0,0);
	    		//player.children[0].play("Walk");
	    		followObject = player;
    		break;
    	}
    	mesh.position.y = -10000;
    	mesh.name = name;
    	content.add( mesh );
    	//if(m2!==null) content.add( m2 );
    	
    	if(type!==10 || type!=='bone'){
    		mesh.receiveShadow = true;
    		mesh.castShadow = true;
    	}
    	return mesh;
	}


	var clearAll = function (){
		player = null;
		followObject = null;
		followSpecial = '';
		var i=content.children.length;
		var j;
		while (i--) {
			content.remove(content.children[ i ]);
		}

		i=contentDebug.children.length;
		while (i--) {
			if(contentDebug.children[ i ].children.length){j =contentDebug.children[ i ].children.length; while (j--){contentDebug.children[ i ].remove(contentDebug.children[ i ].children[j]);}}
			contentDebug.remove(contentDebug.children[ i ]);
		}

		i=contentJoint.children.length;
		while (i--) {
			contentJoint.remove(contentJoint.children[ i ]);
		}

		i=contentSpecial.children.length;
		while (i--) {
			contentSpecial.remove(contentSpecial.children[ i ]);
		}

		/*var obj, i;
	    for ( i = content.children.length - 1; i >= 0 ; i -- ) {
				obj = content.children[ i ];
				content.remove(obj);
		}*/

		//lightsAnimation(0.5, 0, 180, 90, 0);
		planeBG.position.set(0, 0.01, 0);
	}

	var addSnake = function (s) {
		if(s==null) s = [10,10,10];
		//var mesh = new THREE.SkinnedMesh( getMeshByName('snake').geometry, getMaterial('mat05') );
		var mesh = getMeshByName('snake');
		mesh.material = getMaterial('mat05');

		mesh.scale.set( s[0], s[1], -s[2] );
		content.add( mesh );
		mesh.receiveShadow = true;
		mesh.castShadow = true;
	}


	var updateSnake = function () {
		var mesh = content.children[10];
		var ref, pos, mtx, rot;
		for (var i=0; i!== mesh.bones.length; i++){
			ref = content.children[i];
			rot = ref.rotation;
			pos = ref.position;

			mesh.bones[i].position.set(pos.x/10, pos.y/10, -pos.z /10);

	        mesh.bones[i].rotation.set( -rot.x, -rot.y+180*ToRad,-rot.z+90*ToRad);
	        //mesh.bones[i].rotation.set( -rot.x, -rot.y+180*ToRad,-rot.z-270*ToRad);
	         
			mesh.bones[i].matrixAutoUpdate = true;
			mesh.bones[i].matrixWorldNeedsUpdate = true;
		}
	}

	// for ragdoll test
	var addSila = function (s) {
		if(s==null) s = [1,1,1];
		//var mesh = new THREE.SkinnedMesh( getMeshByName('sila').geometry, getMaterial('mat08') );
		var mesh = getMeshByName('sila')
		mesh.material = getMaterial('mat08');
		mesh.scale.set( s[0], s[1], s[2] );
		//mesh.position.y=90;
		content.add( mesh );
		mesh.receiveShadow = true;
		mesh.castShadow = true;

		var n = mesh.bones.length;
		var e;
		for (var i=0; i!==n ; i++){
		  e = new THREE.AxisHelper( 10 )
			content.add( e );
			var mtx = mesh.bones[i].matrix//matrixWorld;

			e.position.x = mesh.bones[i].position.x;
			e.position.y = mesh.bones[i].position.y+90;
			e.position.z = mesh.bones[i].position.z-30;

			e.rotation.x = mesh.bones[i].rotation.x;
			e.rotation.y = mesh.bones[i].rotation.y;
			e.rotation.z = mesh.bones[i].rotation.z;

			//e.rotation.setFromRotationMatrix( mtx );
		}
	}

	var updateSila = function () {
		var mesh = content.children[23];
		var ref, pos, mtx, rot;
		for (var i=0; i!== mesh.bones.length; i++){
			ref = content.children[i];
			rot = ref.rotation;
			pos = ref.position;

			//mesh.bones[i].position.set(pos.x, pos.y, -pos.z);
			mesh.bones[i].position.set( pos.x, pos.y, pos.z);
		//	mesh.bones[i].rotation.set( rot.x, rot.y, rot.z);
	mesh.bones[i].rotation.set( rot.y, rot.x, rot.z);
	//mesh.bones[i].rotation.set( rot.z+180*ToRad, rot.x+180*ToRad, rot.y+180*ToRad);
	        //mesh.bones[i].rotation.set( -rot.x+0*ToRad, -rot.y-180*ToRad, -rot.z-180*ToRad);
	       // mesh.bones[i].rotation.set( -rot.x, -rot.y+180*ToRad,-rot.z-90*ToRad);
	         
			mesh.bones[i].matrixAutoUpdate = true;
			mesh.bones[i].matrixWorldNeedsUpdate = true;
		}
	}

	var getSqueletonStructure = function (name){
		var mesh = new THREE.SkinnedMesh( getMeshByName(name).geometry, null );
		mesh.scale.set( 1, 1, 1 );
		var pos = [];
		var rot = [];

		if(mesh.bones.length!==0){
			var n = mesh.bones.length;
			for (var i=0; i!==n ; i++){
				//pos[i] = [(mesh.bones[i].position.x*0.01).toFixed(3), ((mesh.bones[i].position.y+90)*0.01).toFixed(3), (mesh.bones[i].position.z*0.01).toFixed(3)];
				//rot[i] = [mesh.bones[i].rotation.x, mesh.bones[i].rotation.y, mesh.bones[i].rotation.z];

				pos[i] = [(mesh.bones[i].position.x*0.01).toFixed(3), ((mesh.bones[i].position.y+90)*0.01).toFixed(3), (mesh.bones[i].position.z*0.01).toFixed(3)];
				//rot[i] = [ mesh.bones[i].rotation.y+0*ToRad, mesh.bones[i].rotation.x+0*ToRad, -mesh.bones[i].rotation.z-0*ToRad];
				rot[i] = [ mesh.bones[i].rotation.x-0*ToRad, mesh.bones[i].rotation.y+0*ToRad, mesh.bones[i].rotation.z+0*ToRad];
				//rot[i] = [ -mesh.bones[i].rotation.x+180*ToRad, mesh.bones[i].rotation.y-180*ToRad, -mesh.bones[i].rotation.z-0*ToRad];
				//rot[i] = [ mesh.bones[i].rotation.y+90*ToRad, mesh.bones[i].rotation.z+180*ToRad, -mesh.bones[i].rotation.x+270*ToRad];
				//rot[i] = [ -mesh.bones[i].rotation.x+90*ToRad, -mesh.bones[i].rotation.y+180*ToRad, -mesh.bones[i].rotation.z+90*ToRad];
				//rot[i] = [ mesh.bones[i].rotation.y+0*ToRad, -mesh.bones[i].rotation.z+0*ToRad, -mesh.bones[i].rotation.x+0*ToRad];
			//}
			}
			OimoWorker.postMessage({tell:"BONESLIST", pos:pos, rot:rot });
		}
	}

	//-----------------------------------------------------
	//  LIGHT
	//-----------------------------------------------------

	var lights = [];

	var initLights = function () {
		lights[0] = new THREE.AmbientLight( 0x555557 );
		scene.add(lights[0]);



		//if(isOptimized) return

		lights[1] = new THREE.DirectionalLight( 0xffffff, 1.3 );
		lights[1].castShadow = true;

		lights[1].shadowCameraNear = 500;
		lights[1].shadowCameraFar = 2000;
		
		lights[1].shadowMapBias = 0.0001;
		lights[1].shadowMapDarkness = 0.5;
		lights[1].shadowMapWidth = 1024;
		lights[1].shadowMapHeight = 1024;

		var lightSize = 2000;

		lights[1].shadowCameraLeft = -lightSize;
		lights[1].shadowCameraRight = lightSize;
		lights[1].shadowCameraTop = lightSize;
		lights[1].shadowCameraBottom = -lightSize;

		lights[1].position.copy( Orbit(center , 35, 45, 1000));
		lights[1].target.position.copy(center);

		scene.add(lights[1]);
	}

	var removeLights = function () {
		//lights[1].castShadow = false;
		scene.remove(lights[1]);
		scene.remove(lights[0]);
		lights.length = 0;
	}

	var moveLights = function (vect) {
		if(lights[1]){
			lights[1].position.copy( Orbit(center , 35, 45, 1000));
			lights[1].target.position.copy(center);
			//lights[1].position.copy( Orbit(center , 35, 45, -1000));
	    }
	}

	//-----------------------------------------------------
	//  DEFINE FINAL GEOMETRY
	//-----------------------------------------------------

	var geo00 = new THREE.PlaneGeometry( 1, 1 );
	var geo01 = new THREE.CubeGeometry( 1, 1, 1 );
	var geo02 = new THREE.SphereGeometry( 1, 32, 16 );
	var geo03 = new THREE.CylinderGeometry( 1, 1, 1, 16 );
	var geo04 = new THREE.SphereGeometry( 1, 32, 16 );
	var geo05 = new THREE.SphereGeometry( 1, 12, 8 );

	var geo00b,geo01b,geo02b,geo03b,geo04b;
	var smoothCube;
	var diceBuffer;
	var colomnBuffer;
	var colomnBaseBuffer;
	var colomnTopBuffer;

	var defineGeometry = function(){
		if(isBuffered){
			geo00b = THREE.BufferGeometryUtils.fromGeometry( geo00 );
			geo01b = THREE.BufferGeometryUtils.fromGeometry( geo01 );
			geo02b = THREE.BufferGeometryUtils.fromGeometry( geo02 );
			geo03b = THREE.BufferGeometryUtils.fromGeometry( geo03 );
			geo04b = THREE.BufferGeometryUtils.fromGeometry( geo04 );
			smoothCube = THREE.BufferGeometryUtils.fromGeometry(getSeaGeometry('box'));
			diceBuffer = THREE.BufferGeometryUtils.fromGeometry(getSeaGeometry('dice'));
			colomnBuffer = THREE.BufferGeometryUtils.fromGeometry(getSeaGeometry('column'));
			colomnBaseBuffer = THREE.BufferGeometryUtils.fromGeometry(getSeaGeometry('columnBase'));
			colomnTopBuffer = THREE.BufferGeometryUtils.fromGeometry(getSeaGeometry('columnTop'));
	    } else {
	    	geo00b = geo00;
			geo01b = geo01;
			geo02b = geo02;
			geo03b = geo03;
			geo04b = geo04;
	    	smoothCube = getSeaGeometry('box');
	    	diceBuffer = getSeaGeometry('dice');
			colomnBuffer = getSeaGeometry('column');
			colomnBaseBuffer = getSeaGeometry('columnBase');
			colomnTopBuffer = getSeaGeometry('columnTop');
	    }
	}

	//-----------------------------------------------------
	//  SEA3D IMPORT
	//-----------------------------------------------------

	var seaList = ['dice_low', 'snake', 'wheel', 'column', 'sila', 'gyro', 'van', 'box', 'droid'];
	var seaN = 0;

	var initSea3DMesh = function (){
		var name = seaList[seaN];
		var SeaLoader = new THREE.SEA3D(true);
		
		SeaLoader.onComplete = function( e ) {
			for (var i=0; i !== SeaLoader.meshes.length; i++){
				if(SeaLoader.meshes[i].name ==="carBody"){scaleGeometry(SeaLoader.meshes[i].geometry)}
				if(SeaLoader.meshes[i].name ==="wheel"){scaleGeometry(SeaLoader.meshes[i].geometry)}
				if(SeaLoader.meshes[i].name ==="vanWheel")scaleGeometry(SeaLoader.meshes[i].geometry);
				if(SeaLoader.meshes[i].name ==="vanBody"){
					scaleGeometry(SeaLoader.meshes[i].geometry, 1, 'x');
					scaleGeometry(SeaLoader.meshes[i].children[0].geometry, 1, 'z');
	    		    scaleGeometry(SeaLoader.meshes[i].children[1].geometry, 1, 'z');
	    		    scaleGeometry(SeaLoader.meshes[i].children[2].geometry, 1, 'x');
				}
				if(SeaLoader.meshes[i].name ==="gyro"){
					scaleGeometry(SeaLoader.meshes[i].geometry, 1, 'x');
					scaleGeometry(SeaLoader.meshes[i].children[0].geometry, 1, 'z');
	    		    scaleGeometry(SeaLoader.meshes[i].children[0].children[0].geometry, 1, 'z');
	    		    scaleGeometry(SeaLoader.meshes[i].children[0].children[0].children[0].geometry, 1, 'x');
				}
				/*if(SeaLoader.meshes[i].name ==="Android"){
					scaleGeometry(SeaLoader.meshes[i].geometry, 1, 'x');
				}*/
				meshs.push( SeaLoader.meshes[i] );
			}
			// load Next
			seaN++;
			if(seaList[seaN]!=null)initSea3DMesh();
			else{
				defineGeometry();
				mainAllObjectLoaded();
				isLoading = false;
			} 
		}

		SeaLoader.load( PATH+'models/'+name+'.sea' );
		//loadInfo.innerHTML = "Loading sea3d model : "+ name;
		document.getElementById("output").innerHTML = "Loading sea3d model : "+ name;
	}

	var getSeaGeometry = function (name, scale, axe){
		var a = axe || "z";
		var s = scale || 1;
		var g = getMeshByName(name).geometry;
		scaleGeometry(g, s, a);
		return g;
	}

	var getMeshByName = function (name){
		//var s = scale || -1;
		for (var i=0; i !== meshs.length; i++){
			if(meshs[i].name === name){
				//if(s!==-1)scaleGeometry(meshs[i].geometry, scale, axe);
				return meshs[i];
			} 
		} 
	}

	var scaleGeometry = function (geometry, scale, Axe) {
		var s = 1;//scale || 1;
		var axe = Axe || 'z' 
		for( var i = 0; i < geometry.vertices.length; i++) {
			var vertex	= geometry.vertices[i];
			if(axe==='x')vertex.x *= -s;
			else vertex.x *= s;
			if(axe==='y')vertex.y *= -s;
			else vertex.y *= s;
			if(axe==='z')vertex.z *= -s;
			else vertex.z *= s;
		}
		geometry.computeFaceNormals();
		geometry.computeCentroids();
		geometry.computeVertexNormals();
		geometry.verticesNeedUpdate = true;
	}

	//-----------------------------------------------------
	//  EVENT
	//-----------------------------------------------------

	/*var startRender = function () {
	    if(!renderLoop) renderLoop = setInterval( function () { requestAnimationFrame( update ); }, 1000 / 60 );
	}

	var stopRender = function () {
		if(renderLoop) {clearInterval(renderLoop); renderLoop = null;}
	}*/

	var prevR=[0,0];
	var Anim="Walk";

	//-----------------------------------------------------
	//
	//  UPDATE ENGINE
	//
	//-----------------------------------------------------

	var update = function () {
		requestAnimationFrame( update, renderer.domElement );

		startTime = Date.now();

		var delta = clock.getDelta();
		

		if(followObject) cameraFollow(followObject.position);

		if(followSpecial === 'gyro'){
			var m00=followObject;
	        var m01=contentSpecial.children[0];
	        m01.position.copy(m00.position);
	        m01.children[0].rotation.y=-(camPos.horizontal-90)*ToRad;
	        m01.children[0].children[0].rotation.x =(camPos.vertical-90)*ToRad;
	        m01.children[0].children[0].children[0].rotation.y += (getDistance(m00.position.x, m00.position.z, prevR[0], prevR[1])) * ToRad;
	        prevR[0] = m00.position.x;
	        prevR[1] = m00.position.z;
		} else if(followSpecial === 'droid'){
			
			movePlayer(delta);

			//var m00 = followObject;
			//player = null;
	       // var m01=contentSpecial.children[0];
	        //var distance = getDistance(m00.position.x, m00.position.z, prevR[0], prevR[1]);
	        //player.position.copy(m00.position);
	       /* if(distance>2){
	        	if(Anim === "Idle"){ Anim="Walk"; player.children[0].play("Walk");}
	        	player.rotation.y=-(camPos.horizontal+90)*ToRad;
	        }
	        else {
	        	if(Anim === "Walk"){ Anim="Idle";
	        		player.children[0].play("Idle");
	        	}
	        }
	        prevR[0] = m00.position.x;
	        prevR[1] = m00.position.z;*/
		}
		//}

		// test 
		/*looker.position.copy(center);
		looker.position.y = 10;
		var dir=Math.atan2(center.z-marker.position.z,center.x-marker.position.x);
		looker.rotation.y = -dir+(90*ToRad);*/


		renderer.render( sceneSky, cameraSky );
		renderer.render( scene, camera );

		time = Date.now();
	    ms = time - startTime;
	    if (time - 1000 > time_prev) { time_prev = time; fpstxt = fps; fps = 0; } 
	    fps++;
	}



	//-----------------------------------------------------
	//  PLAYER MOVE
	//-----------------------------------------------------

	var playerSet = {animation:'Idle', destX:0, destZ:0, maxSpeed:0.02, speed:0, acc:0.001, decay:0.9};


	var setPlayerDestination = function (){
		//playerSet.destX = marker.position.x;
		//playerSet.destZ = marker.position.z;
		//player.rotation.y = - Math.atan2(player.position.z-marker.position.z,player.position.x-marker.position.x)//+(90*ToRad);
	}

	var movePlayer = function (delta){
		if (mouse.down && selected.name!=='background'){
			playerSet.destX = marker.position.x;
			playerSet.destZ = marker.position.z;
			if (playerSet.speed < playerSet.maxSpeed) playerSet.speed += playerSet.acc;
			if(playerSet.animation === 'Idle'){ playerSet.animation = 'Walk'; player.children[0].play(playerSet.animation);}
		}else{
			if (playerSet.speed > 0.001) playerSet.speed *= playerSet.decay;
			else{ playerSet.speed = 0; if(playerSet.animation === 'Walk'){ playerSet.animation = 'Idle';player.children[0].play(playerSet.animation);} }	
		}

		player.position.x += (playerSet.destX - player.position.x) * playerSet.speed;
		player.position.z += (playerSet.destZ - player.position.z) * playerSet.speed;
		player.rotation.y = - Math.atan2(player.position.z-marker.position.z,player.position.x-marker.position.x)//+(90*ToRad);
		//player.children[0].play(playerSet.animation);
        THREE.AnimationHandler.update( delta*(0.5 +  (playerSet.speed*5)) );
		//player.position.x += (playerSet.destX - player.position.x) / playerSet.speed;
		//player.position.z += (playerSet.destZ - player.position.z) / playerSet.speed;
		player.position.y = 0;//22;


		OimoWorker.postMessage({tell:"PLAYERMOVE", x:player.position.x*0.01, y:player.position.y*0.01,z:player.position.z*0.01, rot:player.rotation.y}); 
	}

	/*function updatePlayerMove() {
		var n = currentPlayer;
		
		if ( key[0] ) controls.speed = clamp( controls.speed + delta * controls.acceleration, -controls.maxSpeed, controls.maxSpeed );
		if ( key[1] ) controls.speed = clamp( controls.speed - delta * controls.acceleration, -controls.maxSpeed, controls.maxSpeed );
		if ( key[2] ) controls.rotation += delta * controls.angularSpeed;
		if ( key[3] ) controls.rotation -= delta * controls.angularSpeed;
		if ( key[3] || key[2]) controls.speed = clamp( controls.speed + 1 * delta * controls.acceleration, -controls.maxSpeed, controls.maxSpeed );

		// speed decay
		if ( ! ( key[0] || key[1]) ) {
			if ( controls.speed > 0 ) {
				var k = exponentialEaseOut( controls.speed / controls.maxSpeed );
				controls.speed = clamp( controls.speed - k * delta * controls.acceleration, 0, controls.maxSpeed );
			} else {
				var k = exponentialEaseOut( controls.speed / (-controls.maxSpeed) );
				controls.speed = clamp( controls.speed + k * delta * controls.acceleration, -controls.maxSpeed, 0 );
			}
		}

		// displacement
		var forwardDelta = controls.speed * delta;
		controls.vx = Math.sin( controls.rotation ) * forwardDelta;
		controls.vz = Math.cos( controls.rotation ) * forwardDelta;

		if(players[n]){
			players[n].rotation.y = controls.rotation;
			players[n].position.x += controls.vx;
			players[n].position.z += controls.vz;
			// animation
			if (key[0]){ if (players[n].currentAnimation.name == "idle") players[n].play("walk");}
			else if (key[1]){ if (players[n].currentAnimation.name == "idle") players[n].play("walk");}
			else{ if(players[n].currentAnimation.name == "walk") players[n].play("idle");}
			// camera follow
			center.copy(players[n].position);
		    moveCamera();
		}
	}*/

	//-----------------------------------------------------
	//  KEYBOARD
	//-----------------------------------------------------

	var key = [0, 0, 0, 0, 0, 0, 0, 0];

	var onKeyDown = function  ( event ) {
		switch ( event.keyCode ) {
		    case 38: case 87: case 90: key[0]=1; break; // up, W, Z
			case 40: case 83:          key[1]=1; break; // down, S
			case 37: case 65: case 81: key[2]=1; break; // left, A, Q
			case 39: case 68:          key[3]=1; break; // right, D
			case 69:                   key[4]=1; break; // E
			case 82:                   key[5]=1; break; // R
			case 32:                   key[6]=1; break; // space
			case 17: case 67:          key[7]=1; break; // ctrl, C
		}
		sendKey(key);
	}

	var onKeyUp = function  ( event ) {
		switch( event.keyCode ) {
			case 38: case 87: case 90: key[0]=0; break; // up, W, Z
			case 40: case 83:          key[1]=0; break; // down, S
			case 37: case 65: case 81: key[2]=0; break; // left, A, Q
			case 39: case 68:          key[3]=0; break; // right, D
			case 69:                   key[4]=0; break; // E
			case 82:                   key[5]=0; break; // R
			case 32:                   key[6]=0; break; // space          
			case 17: case 67:          key[7]=0; break; // ctrl, C
		}
		sendKey(key);
	}

	//-----------------------------------------------------
	//  MOUSE COLLISION DETECTION
	//-----------------------------------------------------

	var rayTest = function () {
		if ( content.children.length ) {
			var vector = new THREE.Vector3( mouse.mx, mouse.my, 1 );
			projector.unprojectVector( vector, camera );
			raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
			
			var intersectsBack = raycaster.intersectObjects( back.children, true );
			var intersects = raycaster.intersectObjects( content.children, true );

			if ( intersectsBack.length || intersects.length ) {
				if(!marker.visible) marker.visible=true;
				if ( intersectsBack.length ) {
					if(markerMaterial.color!==0x888888)markerMaterial.color.setHex(0x888888);
					point = intersectsBack[0].point;
					marker.position.copy( point );
					selected = intersectsBack[0].object;
				}
				if ( intersects.length ) {
					if(markerMaterial.color!==0xffffff) markerMaterial.color.setHex(0xFFFFFF);
					//if(!marker.visible)marker.visible=true;
					//if(intersects[0].face!==null)marker.lookAt(intersects[0].face.normal);
					//console.log("intersects.length: "+ intersects.length);
					//console.log("intersects.distance: "+ intersects[0].distance);
					//console.log("intersects.face: "+ intersects[0].face);
					point = intersects[0].point;
					marker.position.copy( point );
					selected = intersects[0].object;
					selectedCenter = point;

					//attachControl(selected);

					if(mouseMode==='delete') delSelected();
					else if(mouseMode==='drag'){
						var p1 = [selected.position.x-point.x, selected.position.y-point.y, selected.position.z-point.z];

					}else if(mouseMode==='shoot'){

					}else if(mouseMode==='push'){

					}
			    }
		    } else {
		    	marker.visible = false;
		    }
		}
	}

	var delSelected = function () {
		OimoWorker.postMessage({tell:"REMOVE", type:'object', n:selected.name});
	}

	var removeObject = function (n) {
		content.remove( content.children[n] );
		for(var i=0; i!== content.children.length; i++){
			content.children[i].name = i;
		}


	}

	//-----------------------------------------------------
	//  MOUSE
	//-----------------------------------------------------

	var onMouseDown = function (e) {
		e.preventDefault();
		mouse.ox = e.clientX;
		mouse.oy = e.clientY;
		mouse.h = camPos.horizontal;
		mouse.v = camPos.vertical;
		mouse.mx = ( e.clientX / vsize.x ) * 2 - 1;
		mouse.my = - ( e.clientY / vsize.y ) * 2 + 1;
		mouse.down = true;
		rayTest();
		if(followSpecial === 'droid')setPlayerDestination();
	}

	var onMouseUp = function (e) {
		mouse.down = false;
		document.body.style.cursor = 'auto';
	}

	var onMouseMove = function (e) {
		e.preventDefault();
		mouse.mx = ( e.clientX / vsize.x ) * 2 - 1;
		mouse.my = -( e.clientY / vsize.y ) * 2 + 1;
		rayTest();

		if (mouse.down && !camPos.automove ) {
			if (mouse.moving) {
				document.body.style.cursor = 'move';
				camPos.horizontal = ((e.clientX - mouse.ox) * 0.3) + mouse.h;
				camPos.vertical = (-(e.clientY - mouse.oy) * 0.3) + mouse.v;
				moveCamera();
			}/* else {
				mouse.mx = ( e.clientX / vsize.x ) * 2 - 1;
		    	mouse.my = -( e.clientY / vsize.y ) * 2 + 1;
		    	rayTest();
			}*/
		}
	}

	var onMouseWheel = function (e) {
		var delta = 0;
		if(e.wheelDeltaY){delta=e.wheelDeltaY*0.01;}
		else if(e.wheelDelta){delta=e.wheelDelta*0.05;}
		else if(e.detail){delta=-e.detail*1.0;}
		camPos.distance-=(delta*10);
		moveCamera();
	}

	//-----------------------------------------------------
	//  TOUCH MOBIL
	//-----------------------------------------------------

	var onTouchStart = function (e) { 
		e.preventDefault();
		var t=event.touches[0];
		mouse.ox = t.clientX;
		mouse.oy = t.clientY;
		mouse.h = camPos.horizontal;
		mouse.v = camPos.vertical;
		mouse.mx = ( t.clientX / vsize.x ) * 2 - 1;
		mouse.my = -( t.clientY / vsize.y ) * 2 + 1;
		mouse.down = true;
		rayTest();
	}

	var onTouchMove = function (e) { 
		e.preventDefault();
		var t=event.touches[0];
		mouse.mx = ( t.clientX / vsize.x ) * 2 - 1;
		mouse.my = -( t.clientY / vsize.y ) * 2 + 1;
		rayTest();
	    if (mouse.down && !camPos.automove ) {
		    if (mouse.moving) {
				document.body.style.cursor = 'move';
				camPos.horizontal = ((t.clientX - mouse.ox) * 0.3) + mouse.h;
				camPos.vertical = (-(t.clientY - mouse.oy) * 0.3) + mouse.v;
				moveCamera();
			}/* else {
				mouse.mx = ( t.clientX / vsize.x ) * 2 - 1;
		    	mouse.my = -( t.clientY / vsize.y ) * 2 + 1;
			}*/
	    }
	}

	//-----------------------------------------------------
	//  CAMERA
	//-----------------------------------------------------

	var vSet = [ {h:90, v:70, d:600}, {h:0, v:60, d:1000}, {h:360, v:45, d:600}, {h:200, v:70, d:1500}, {h:0, v:10, d:1000} ];
	var currentView = 0;

	var moveCamera = function () {
		camera.position.copy(Orbit(center, camPos.horizontal, camPos.vertical, camPos.distance, true));
		camera.lookAt(center);

		cameraSky.position.copy(camera.position);
		cameraSky.lookAt(center);
	}

	var endMove = function () {
		camPos.automove = false;
	}

	var changeView = function (h, v, d) {
		TweenLite.to(camPos, 3, {horizontal: h, vertical: v, distance: d, onUpdate: moveCamera, onComplete: endMove });
		camPos.automove = true;
	}

	var cameraFollow = function (vec) {
		center.copy(vec);
		moveLights();
		moveCamera();
		planeBG.position.set(center.x, 0, center.z);
	}

	var switchView = function () {
		var n = currentView;
		changeView(vSet[n].h, vSet[n].v, vSet[n].d);
		currentView++;
		if(currentView === vSet.length) currentView = 0;
	}

	//-----------------------------------------------------
	//  RESIZE
	//-----------------------------------------------------

	var viewResize = function () {
		vsize = { x:window.innerWidth*vmid.x, y:window.innerHeight*vmid.y, z:0 };
		vsize.z = vsize.x/vsize.y;
		camera.aspect = vsize.z;
		camera.updateProjectionMatrix();
		cameraSky.aspect = vsize.z;
		cameraSky.updateProjectionMatrix();
		renderer.setSize( vsize.x, vsize.y );
	}

	var viewDivid = function () {
		if(vmid.mode==='no'){
			if(window.innerWidth < window.innerHeight){ vmid.y = 0.5; vmid.x = 1; vmid.mode = 'h';
			} else { vmid.x = 0.5; vmid.y = 1; vmid.mode = 'v';}
	    } else {
	    	vmid.x = 1;
	    	vmid.y = 1;
	    	vmid.mode = 'no';
	    }
		viewResize();
	}

	//-----------------------------------------------------
	//  MATH
	//-----------------------------------------------------

	var ToRad = Math.PI / 180;
	var ToDeg = 180 / Math.PI;

	var exponentialEaseOut = function ( v ) { return v === 1 ? 1 : - Math.pow( 2, - 10 * v ) + 1; };

	var clamp = function (a,b,c) { return Math.max(b,Math.min(c,a)); }

	var Orbit = function (origine, horizontal, vertical, distance, MainCamera) {
		var mainCamera = MainCamera || false;
		var p = new THREE.Vector3();
		var phi = unwrapDegrees(vertical)*ToRad;
		var theta = unwrapDegrees(horizontal)*ToRad;
		if(mainCamera){
			camPos.phi = phi; camPos.theta = theta;
			sendCameraOrientation(phi, theta);
		} 
		p.x = (distance * Math.sin(phi) * Math.cos(theta)) + origine.x;
		p.z = (distance * Math.sin(phi) * Math.sin(theta)) + origine.z;
		p.y = (distance * Math.cos(phi)) + origine.y;
		return p;
	}

	var unwrapDegrees = function (r) {
		r = r % 360;
		if (r > 180) r -= 360;
		if (r < -180) r += 360;
		return r;
	}

	var getDistance = function  (x1, y1, x2, y2) {
		return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
	}



	// public methode

	return {

		domElement: container,

		init:init,
		clearAll:clearAll,
		createObjects:createObjects,
		createStaticObjects:createStaticObjects,
		createJoints:createJoints,

		content:content,
		contentJoint:contentJoint,

		materials:materials,
		getMaterial:getMaterial,

		updateSila:updateSila,
		updateSnake:updateSnake,
		getSqueletonStructure:getSqueletonStructure,

		switchView:switchView,

		updateBallCamera:updateBallCamera,

		ADD:ADD,
		REMOVE:REMOVE,
		removeObject:removeObject,

		viewDivid:viewDivid,

		//options
		reflection:reflection,
		debug:debug,
		shadow:shadow,
		changeMaterialType:changeMaterialType,
		getViewMode: function () {
			return vmid.mode;
		},

		setMouseMode: function (name) {
			mouseMode = name;
		},
		getFps: function (name) {
			return fpstxt +" fps / "+ ms+" ms";
		},
		getSelected: function () {
			if(selected) return selected.name;
		},
		getAnistropy: function (name) {
			return MaxAnistropy;
		},
	}

};