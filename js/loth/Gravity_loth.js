/**
 * @author loth / http://3dflashlo.wordpress.com/
 */

var Gravity_loth = function () {
	var G = -10;
	var drag;
	var finalFunction;

	var startTime = Date.now(), prevTime = startTime;
	var ms = 0, msMin = Infinity, msMax = 0;
	var fps = 0, fpsMin = Infinity, fpsMax = 0;
	var frames = 0, mode = 0;

	var unselect = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; -user-select: none;'

	var container = document.createElement( 'div' );
	container.id = 'gravity';
	container.style.cssText = unselect + 'position:absolute; bottom:110px; right:20px; color:rgba(1,1,1,0.8)';

	var loDiv = document.createElement( 'div' );
	loDiv.id = 'lo';
	loDiv.style.cssText = 'width:40px;height:200px;padding:0 0 0 0;text-align:left;display:block;background:rgba(255,255,255,0.05);border:1px solid rgba(1,1,1,0.3);-webkit-border-radius:20px; border-radius:20px; cursor:ns-resize;text-align:center;';
	container.appendChild( loDiv );
	

	var center = document.createElement( 'div' );
	center.style.cssText = 'position:absolute;width:30px;left:5px;height:1px;padding:0 0 0 0; background:rgba(1,1,1,0.3); top:100px; pointer-events:none;';
	loDiv.appendChild( center );

	var select = document.createElement( 'div' );
	select.style.cssText = 'position:absolute;width:30px;left:5px;height:1px;padding:0 0 0 0; background:rgba(255,255,1,0.8); top:100px; pointer-events:none;';
	loDiv.appendChild( select );

	var txt = document.createElement( 'div' );
	txt.style.cssText = 'position:absolute;width:40px;height:30px;padding:0 0 0 0; top:105px; pointer-events:none;font-size:12px;font-family:Monospace;text-align:center;';
	loDiv.appendChild( txt );

	var txt2 = document.createElement( 'div' );
	txt2.style.cssText = 'position:absolute;width:40px;height:30px;padding:0 0 0 0; top:85px; pointer-events:none;font-size:12px;font-family:Monospace;text-align:center;';
	loDiv.appendChild( txt2 );
	txt2.textContent ="G";

	loDiv.addEventListener( 'mousedown', function(e){ drag = true; move(e); }, false );
	loDiv.addEventListener( 'mouseout', function(e){ drag = false; }, false );
	loDiv.addEventListener( 'mouseup', function(e){ drag = false; }, false );
	loDiv.addEventListener( 'mousemove', function(e){ move(e); } , false );

	var move =  function ( e ) {
		var rect = loDiv.getBoundingClientRect();
		var pos;
		if(drag){
			pos = parseInt(e.clientY-rect.top);
			if(pos<0)pos=0;
			if(pos>200)pos=200;
			select.style.top = pos+"px";
			G = -(pos-100)/10;
			txt.textContent =G;
			if(finalFunction)finalFunction(G);

			if(pos<10 || pos>190){ 
				select.style.width = '10px';
				select.style.left = '15px';
			}else{
				select.style.width = '30px';
				select.style.left = '5px';
			}
		}
	}

	var moveDef =  function ( g ) {
		var rect = loDiv.getBoundingClientRect();
		var pos = (((-g)*10)+100);

		G = g;
		txt.textContent = G;
		select.style.top = pos +"px";

		if(pos<10 || pos>190){ 
			select.style.width = '10px';
			select.style.left = '15px';
		}else{
			select.style.width = '30px';
			select.style.left = '5px';
		}
		
	}

	return {
		domElement: container,

		setup: function (g, ff) {
			finalFunction = ff;
			moveDef(g);
		}

	}

};
