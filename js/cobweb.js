var numCobweb = 0;
var canvas = [];

// Plug-in function=================================================== 
$.fn.plugCob = function(options){
	var defaults = {
		color: "white",					// Color of points
		opacity: 0.5,					// Opacity of points, can be "random" between 0.4 and 0.7, or value from 0 to 1.
		colorLine: "white",				// Color of lines
		opacityLine: 0.5,				// Opacity of lines, can be "random" between 0.4 and 0.7, or value from 0 to 1.
		opacityRange: {min:0.4,max:0.7},// Set range of opacity, use this only if you use "random" opacity for points and/or for lines.
		countPoints: 6,					// Numbers of points in the canvas
		radiusPoint: 7,
		radiusMouse: 60,	
		distance: 20,					// Distance between points
		top: "0px",						// Top, Right, Bottom, Left of element canvas in position: relative
		right: "0px",
		bottom: "0px",
		left: "0px",
		getResize: true,				// Set false to use fewer resources
		responsive: false
	};
	var settings = $.extend( {}, defaults, options );
	var global = settings;
	var height, width;
	if(settings !== undefined){
		if(settings.height === undefined) 
			height = this.height();
		else
			height = settings.height;
		if(settings.width === undefined)
			width = this.width();
		else
			width = settings.width;
	}else{
 		height = this.height();
 		width = this.width();
	}
	var maxim = higherCountPoints(global.countPoints, global.responsive);
	var divHeight = this.height();
	var divWidth = this.width();
	this.append("<canvas width = "+width+" height = "+height+" style = 'position: relative; top:"+settings.top+"; right:"+settings.right+"; bottom:"+settings.bottom+"; left:"+settings.left+";'></canvas>");
	canvas.push(new Cobweb(
		this.children()[0], 
		settings.color, 
		settings.opacity, 
		settings.colorLine, 
		settings.opacityLine,
		settings.opacityRange,
		maxim, 
		settings.radiusPoint, 
		settings.radiusMouse, 
		settings.distance,
		settings.getResize,
		divHeight,
		divWidth,
		global
	));
	numCobweb++;
	activeCobweb(canvas[numCobweb-1]);
	// Take the event======================================================
	$(this.children()[0]).mousemove(function(event){
		mouseHunting(event,objActive(event.target));
	});
	$(this.children()[0]).mouseout(function(event){
		mouseOut(objActive(event.target));
	});
	$(this.children()[0]).bind('touchmove', function(jQueryEvent){
		jQueryEvent.preventDefault();
		if(!event) var event = jQueryEvent.originalEvent;
		mouseHunting(event.touches[0],objActive(event.target));
	});
	$(this.children()[0]).bind('touchend', function(jQueryEvent){
		if(!event) var event = jQueryEvent.originalEvent;
		mouseOut(objActive(event.target));
	});
	/*$(this.children()[0]).bind('touchleave', function(jQueryEvent){
		mouseOut(objActive(event.target));
	});*/
};

function objActive(e){
	for(i=0;i<numCobweb;i++)
		if(e==canvas[i].c)
			return canvas[i];
}

// Constructors and functions for use this plug-in==================
function Cobweb(c, color, opacity, colorLine, opacityLine, opacityRange, countPoints, radiusPoint, radiusMouse, distance, getResize, divHeight, divWidth, global){
	this.c = c; 							// The canvas element
	this.color = color;						// Color Nests and lines
	this.opacity = opacity, 
	this.colorLine = colorLine, 
	this.opacityLine = opacityLine, 
	this.countPoints = countPoints;
	this.radiusPoint = radiusPoint;
	this.radiusMouse = radiusMouse;
	this.distance = distance;
	this.spider = [countPoints];			// What are the nests moving by the spider run away from the hunter
	this.cobweb = [countPoints];			// Array with Nest and Gossmer
	this.cobwebInit = [countPoints];		// Copy of Nest's initial position 
	this.a = [countPoints];					// Opacity random
		for(i=0;i<countPoints;i++) this.a[i] = Math.round((Math.random()*(opacityRange.max-opacityRange.min)*10)+opacityRange.min*10)/10;
	this.aLine = new Array(countPoints);		// Opacity random
		for(i=0;i<countPoints;i++) this.aLine[i] = new Array(6);
		for(i=0;i<countPoints;i++) 
			for(j=0;j<6;j++) this.aLine[i][j] = Math.round((Math.random()*(opacityRange.max-opacityRange.min)*10)+opacityRange.min*10)/10;
	this.cantBack = false;
	this.interval = 0;
	this.atHome = 0;
	this.loop = 0;							// loop and re-draw only when it's necessary
	this.cursX = -10000;
	this.cursY = -10000;
	this.getResize = getResize;				// I have to resize? true or false
	this.divHeight = divHeight;
	this.divWidth = divWidth;
	this.global = global;					// Store the global settings of the cobwebs
	this.usingBreak = -2;					// remember in whick breakpoint of responsive we cancelAnimationFrame
}

// Get the Higher CountPoints from global or breakpoints of responsive ============================
function higherCountPoints(countPoints, responsive){
	var max = countPoints;
	if(responsive)
		for(var k = 0;k<responsive.length;k++)
			if(responsive[k].settings.countPoints > max)
				max = responsive[k].settings.countPoints;
	return max;
}

// CLASS Nest: the points in the canvas============================================================
function Nest(x, y, percentX, percentY){
	this.x = x;
	this.y = y;
	this.percentX = percentX;
	this.percentY = percentY;
	this.startPos = true;
}

// CLASS Gossmer: the line in the canvas===========================================================
function Gossmer(x, y, percentX1, percentY1, nest){
	this.x1 = x;
	this.y1 = y;
	this.percentX1 = percentX1;
	this.percentY1 = percentY1;
	this.x2 = nest.x;
	this.y2 = nest.y;
}
	Gossmer.prototype.setXY2 = function(nest){
		this.x2 = nest.x;
		this.y2 = nest.y;
	};

// VARIABLES usefull===============================================================================
var i, j, k, count = 0, posY = -1000, posX = -1000, posX2, posXI, posYI; //useful variables
var back, lastX, lastY, varX, varY; //variables for the goBack()
var collide = false; // variables for check collision with mouse
var a; //use for opacity.
var change = false;
var moveX, moveY;
var moveV = 1;

// Init============================================================================================
function activeCobweb(cw){
	for(i=0;i<cw.countPoints;i++){
		cw.cobweb[i] = [2];
		for(j=0;j<6;j++){
			cw.cobweb[i][1] = [6];
		}
	}
	var ctx = cw.c.getContext("2d");
	fillCobweb(cw.cobweb, cw);
	cloneCobweb(cw.cobweb, cw);
	if(cw.global.responsive){
		var changeSet = responsiveNow(cw.global.responsive, cw);
		if(changeSet){
			var newSet = $.extend( {}, cw.global, changeSet );
			changeSettings(cw, newSet);
		}else{
			cw.countPoints = cw.global.countPoints;
		}
	}
	drawCobweb(ctx, cw.cobweb, cw);
}

// take the mouse moviment and decide what to do=================================================================== 
function mouseHunting(event, cw){
	cobweb = cw.cobweb;
	localizeHunter(event, cw); //set cw.cursX and cw.cursY
	for(i=0;i<cw.countPoints;i++) cw.spider[i] = 0; //noSpiderMove
	for(i=0;i<cw.countPoints;i++) collisionCheck(i,0,cobweb,cw);
	if(collide){
		collide = false;
		if(cw.loop==0)
			cw.loop = requestAnimationFrame(function(){animloop(cw)});
		spiderEscape(cobweb,cw);
		if(cw.interval==0)
			cw.interval = setInterval(function(){ spiderFree(cw); }, 7);
	}
}

function mouseOut(cw){
	cw.cursX = -10000;
	cw.cursY = -10000;
}

// Fill an array with Nest and Gossmer========================================
function fillCobweb(cobweb, cw){
	var numPoints;
	maxPoints = higherCountPoints(cw.countPoints, cw.global.responsive);
	for(i=0;i<maxPoints;i++){
		if(i>0){
			posX = Math.floor((Math.random()*(cw.c.width-30))+15);
			posY = Math.floor((Math.random()*(cw.c.height-30))+15);
			for(k = 0;k<i;k++){
				var ipotenusa = Math.sqrt(Math.pow(cobweb[k][0].x-posX,2)+Math.pow(cobweb[k][0].y-posY,2));
				if((ipotenusa<cw.distance)&&(count<= 100)){
					k = -1;
					count++;
					posX = Math.floor((Math.random()*(cw.c.width-30))+15);
					posY = Math.floor((Math.random()*(cw.c.height-30))+15);
				}
			}
			count = 0;
		}else{
			posX = Math.floor((Math.random()*(cw.c.width-30))+15);
			posY = Math.floor((Math.random()*(cw.c.height-30))+15);
		}
		cobweb[i][0] = new Nest(posX, posY, (100*posX/cw.c.width), (100*posY/cw.c.height));
		for(j=0;j<6;j++){
			if(j<3){
				posY = 0;
			}else{
				posY = cw.c.height;
			}
			switch(j){
				case 0:
				case 3:
					posX2 = cobweb[i][0].x;
					posX = 0;
					break;
				case 1:
				case 4:
					posX2 = cw.c.width*2/3
					posX = cw.c.width/3;
					break;
				case 2:
				case 5:
					posX2 = cw.c.width-cobweb[i][0].x;
					posX = cobweb[i][0].x;
					break;
			}
			var gossX = Math.floor((Math.random() * posX2) + posX);
			cobweb[i][1][j] = new Gossmer(
				gossX,
				posY,
				(100*gossX/cw.c.width),
				(100*posY/cw.c.height),
				cobweb[i][0]);
		}
	}
}

// Make a clon of cobweb========================================================================================= 
function cloneCobweb(cobweb, cw){
	for(i=0;i<cw.countPoints;i++)
		cw.cobwebInit[i] = new Nest(cobweb[i][0].x,cobweb[i][0].y);
}

// ANIMATE WITH THE BROWSER FRAME RATE=========================================================================== 
(function(){
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x){
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}
	if(!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	if(!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id){
			clearTimeout(id);
		};
}());

function animloop(cw){
	var ctx = cw.c.getContext("2d");
	ctx.clearRect(0, 0, cw.c.width, cw.c.height);
	drawCobweb(ctx, cw.cobweb, cw);
	cw.loop = requestAnimationFrame(function(){animloop(cw)});
}

// Draw the cobeweb in the canvas================================================================================= 
function drawCobweb(ctx, cobweb, cw){
	for(i=0;i<cw.countPoints;i++){
		for(j=0;j<6;j++){
			ctx.beginPath();
			ctx.globalAlpha = 1;
			ctx.moveTo(cobweb[i][1][j].x1, cobweb[i][1][j].y1);
			ctx.lineTo(cobweb[i][1][j].x2, cobweb[i][1][j].y2);
			ctx.strokeStyle = cw.colorLine;
			ctx.stroke();
		}
	}
	for(i=0;i<cw.countPoints;i++){
		for(j=0;j<6;j++){
			ctx.beginPath();
			if(cw.opacityLine=="random"){
				a = cw.aLine[i][j];
			}else{
				a = cw.opacityLine;
			}
			ctx.globalAlpha = a;
			ctx.moveTo(cobweb[i][1][j].x1, cobweb[i][1][j].y1);
			ctx.lineTo(cobweb[i][1][j].x2, cobweb[i][1][j].y2);
			ctx.strokeStyle = "#ffffff";
			ctx.stroke();
		}
		ctx.beginPath();
		ctx.globalAlpha = 1;
		ctx.arc(cobweb[i][0].x, cobweb[i][0].y, cw.radiusPoint, 0, 2*Math.PI);
		ctx.fillStyle = cw.color;
		ctx.fill();
	
	}
	for(i=0;i<cw.countPoints;i++){
		ctx.beginPath();
		if(cw.opacity=="random"){
			a = cw.a[i];	
		}else{
			a = cw.opacity;
		}
		ctx.globalAlpha = a;
		ctx.arc(cobweb[i][0].x, cobweb[i][0].y, cw.radiusPoint, 0, 2*Math.PI);
		ctx.fillStyle = "#ffffff";
		ctx.fill();
	}
}

// Check if the mouse collide with one or more nests==============================================================
function collisionCheck(i, who, cobweb, cw){
	//There are some nest cobweb[i][0] here in this position?
	if(Math.pow(cw.cursX-cobweb[i][0].x,2)+Math.pow(cw.cursY-cobweb[i][0].y,2) <= Math.pow(cw.radiusPoint+cw.radiusMouse,2)){
		// Collision Found
		moveV = 1;
		if(who==0){
			cw.spider[i] = 1;
			collide = true;
		}else{
			cw.cantBack = true;
		}
	}
	if(Math.pow(cw.cursX-cobweb[i][0].x,2)+Math.pow(cw.cursY-cobweb[i][0].y,2) < Math.pow(cw.radiusPoint+cw.radiusMouse,2))
		moveV = 3;
}

// Reset the x2 y2 of gossmers
function followNest(i, cw, nest){
	for(j=0;j<6;j++)
		cw.cobweb[i][1][j].setXY2(nest);
}

// Check if the spider have a free way to return in the initial position=========================================== 
function spiderFree(cw){
	cw.atHome = 0;
	cobweb = cw.cobweb;
	for(i=0;i<cw.countPoints;i++){
		if(!cobweb[i][0].startPos){
			goBack(i, cobweb, cw);
		}else{
			cw.atHome += 1;
		}
	}
	if(cw.atHome==cw.countPoints){
		clearInterval(cw.interval);
		cancelAnimationFrame(cw.loop);
		cw.interval = 0;
		cw.loop = 0;
	}
	if(change){
		change = false;
	}
}

function goBack(i, cobweb, cw){
	lastX = cobweb[i][0].x;
	lastY = cobweb[i][0].y;
	posX = Math.round(cobweb[i][0].x);
	posY = Math.round(cobweb[i][0].y);
	posXI = cw.cobwebInit[i].x;
	posYI = cw.cobwebInit[i].y;
	varX = Math.abs(posX-posXI);
	varY = Math.abs(posY-posYI);
	if((posX!= posXI)||(posY!= posYI)){
		moveX = 3;
		moveY = 3;
		if(varX==1) moveX = 1;
		if(varY==1) moveY = 1;
		if(varX==0){
			if(posY>posYI){
				cobweb[i][0].y = posY-moveY;
				collisionCheck(i,1,cobweb,cw);
				if(cw.cantBack){
					cw.cantBack = false;
					cobweb[i][0].y = lastY;
				}else{
					followNest(i, cw, cobweb[i][0]);
					change = true;
				}
			}else{
				cobweb[i][0].y = posY+moveY;
				collisionCheck(i,1,cobweb,cw);
				if(cw.cantBack){
					cw.cantBack = false;
					cobweb[i][0].y = lastY;
				}else{
					followNest(i, cw, cobweb[i][0]);
					change = true;
				}
			}
		}else{
			if(varY==0){
				if(posX>posXI){
					cobweb[i][0].x = posX-moveX;
					collisionCheck(i,1,cobweb,cw);
					if(cw.cantBack){
						cw.cantBack = false;
						cobweb[i][0].x = lastX;
					}else{
						followNest(i, cw, cobweb[i][0]);
						change = true;
					}
				}else{
					cobweb[i][0].x = posX+moveX;
					collisionCheck(i,1,cobweb,cw);
					if(cw.cantBack){
						cw.cantBack = false;
						cobweb[i][0].x = lastX;
					}else{
						followNest(i, cw, cobweb[i][0]);
						change = true;
					}
				}
			}else{
				if(varX>varY){
					if(posX>posXI){
						cobweb[i][0].x = posX-moveX;
						cobweb[i][0].y = ((posX-moveX-posXI)/(posX-posXI)*(posY-posYI))+posYI;
						collisionCheck(i,1,cobweb,cw);
						if(cw.cantBack){
							cw.cantBack = false;
							cobweb[i][0].x = lastX;
							cobweb[i][0].y = lastY;
						}else{
							followNest(i, cw, cobweb[i][0]);
							change = true;
						}
					}else{
						cobweb[i][0].x = posX+moveX;
						cobweb[i][0].y = ((posX+moveX-posXI)/(posX-posXI)*(posY-posYI))+posYI;
						collisionCheck(i,1,cobweb,cw);
						if(cw.cantBack){
							cw.cantBack = false;
							cobweb[i][0].x = lastX;
							cobweb[i][0].y = lastY;
						}else{
							followNest(i, cw, cobweb[i][0]);
							change = true;
						}
					}
				}else{
					if(posY>posYI){
						cobweb[i][0].y = posY-moveY;
						cobweb[i][0].x = ((posY-moveY-posYI)/(posY-posYI)*(posX-posXI))+posXI;
						collisionCheck(i,1,cobweb,cw);
						if(cw.cantBack){
							cw.cantBack = false;
							cobweb[i][0].x = lastX;
							cobweb[i][0].y = lastY;
						}else{
							followNest(i, cw, cobweb[i][0]);
							change = true;
						}
					}else{
						cobweb[i][0].y = posY+moveY;
						cobweb[i][0].x = ((posY+moveY-posYI)/(posY-posYI)*(posX-posXI))+posXI;
						collisionCheck(i,1,cobweb,cw);
						if(cw.cantBack){
							cw.cantBack = false;
							cobweb[i][0].x = lastX;
							cobweb[i][0].y = lastY;
						}else{
							followNest(i, cw, cobweb[i][0]);
							change = true;
						}
					}
				}
			}
		}
	}
	if((posX==posXI)&&(posY==posYI)){
		cobweb[i][0].startPos = true;
	}
}

// Change the X and Y of the nests that want escape from the mouse/hunter=================================================
function spiderEscape(cobweb, cw){
	for(i=0;i<cw.countPoints;i++){
		if(cw.spider[i] == 1){
			var variationX = cobweb[i][0].x-cw.cursX;
			var variationY = cobweb[i][0].y-cw.cursY;
			if(Math.abs(variationX) > Math.abs(variationY)){
				if(variationX > 0){ //nestX go right of 1unit
					cobweb[i][0].x = cobweb[i][0].x+moveV;
					if(cobweb[i][0].y != cw.cursY)
						cobweb[i][0].y = ((cobweb[i][0].x+moveV-cw.cursX)/(cobweb[i][0].x-cw.cursX)*(cobweb[i][0].y-cw.cursY))+cw.cursY;
				}else{
					if(variationX < 0){ //nestX go left of 1unit
						cobweb[i][0].x = cobweb[i][0].x-moveV;
						if(cobweb[i][0].y != cw.cursY)
							cobweb[i][0].y = ((cobweb[i][0].x-moveV-cw.cursX)/(cobweb[i][0].x-cw.cursX)*(cobweb[i][0].y-cw.cursY))+cw.cursY;
					}
				}
			}
			if(Math.abs(variationX) <= Math.abs(variationY)){
				if(variationY > 0){ 
					cobweb[i][0].y = cobweb[i][0].y+moveV;
					if(cobweb[i][0].x != cw.cursX)
						cobweb[i][0].x = ((cobweb[i][0].y+moveV-cw.cursY)/(cobweb[i][0].y-cw.cursY)*(cobweb[i][0].x-cw.cursX))+cw.cursX;
				}else{
					if(variationY < 0){ 
						cobweb[i][0].y = cobweb[i][0].y-moveV;
						if(cobweb[i][0].x != cw.cursX)
							cobweb[i][0].x = ((cobweb[i][0].y-moveV-cw.cursY)/(cobweb[i][0].y-cw.cursY)*(cobweb[i][0].x-cw.cursX))+cw.cursX;
					}
				}
			}
			cobweb[i][0].startPos = false;
			followNest(i, cw, cobweb[i][0]);
		}
	}
}

// take the mouse position and save in cw.cursX and cw.cursY==============================================================
function localizeHunter(event, cw) {
	canoffset = $(cw.c).offset();
	cw.cursX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - Math.floor(canoffset.left);
	cw.cursY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop - Math.floor(canoffset.top) + 1;
}

// Get and handle the resize event =======================================================================================
$(window).resize(function(){
	for(var i=0;i<numCobweb;i++){
		if(canvas[i].global.responsive){
			var changeSet = responsiveNow(canvas[i].global.responsive, canvas[i]);
			if(changeSet){
				if(canvas[i].usingBreak != -1){
					newSet = $.extend( {}, canvas[i].global, changeSet );
					changeSettings(canvas[i], newSet);
					var ctx = canvas[i].c.getContext("2d");
					ctx.clearRect(0, 0, canvas[i].c.width, canvas[i].c.height);
					drawCobweb(ctx, canvas[i].cobweb, canvas[i]);
				}else{
					changeSettings(canvas[i], canvas[i].global);
					var ctx = canvas[i].c.getContext("2d");
					ctx.clearRect(0, 0, canvas[i].c.width, canvas[i].c.height);
					drawCobweb(ctx, canvas[i].cobweb, canvas[i]);
				}
			}
		}
		if(canvas[i].getResize)
			if(sizeChange(canvas[i]))
				updateCob(canvas[i]);
			//setTimeout(function(){ console.log(canvas[i]); if(sizeChange(canvas[i])) updateCob(canvas[i]); },10);
	}
});

function sizeChange(cw){
	console.log("e qui si");
	//console.log("cw.divWidth"+cw.divWidth);
	//console.log("$(cw.c).parent().width()"+$(cw.c).parent().width());
	if((cw.divWidth != $(cw.c).parent().width())||(cw.divHeight != $(cw.c).parent().height())){
		console.log("non entro :(");
		return true;
	}
		
	return false;
}

function updateCob(cw){
	cw.c.width = $(cw.c).parent().width();
	cw.c.height = $(cw.c).parent().height();
	for(k=0;k<cw.countPoints;k++){
		cw.cobweb[k][0].x = Math.round(cw.cobweb[k][0].percentX*cw.c.width/100);
		cw.cobweb[k][0].y = Math.round(cw.cobweb[k][0].percentY*cw.c.height/100);
		cw.cobwebInit[k].x = cw.cobweb[k][0].x;
		cw.cobwebInit[k].y = cw.cobweb[k][0].y;
		for(j=0;j<6;j++){
			cw.cobweb[k][1][j].x1 = Math.round(cw.cobweb[k][1][j].percentX1*cw.c.width/100);
			cw.cobweb[k][1][j].y1 = Math.round(cw.cobweb[k][1][j].percentY1*cw.c.height/100);
		}
		followNest(k, cw, cw.cobweb[k][0]);
		var ctx = cw.c.getContext("2d");
		ctx.clearRect(0, 0, cw.c.width, cw.c.height);
		drawCobweb(ctx, cw.cobweb, cw);
	}
	cw.divWidth = $(cw.c).parent().width();
	cw.divHeight = $(cw.c).parent().height();
}

// Make it responsive ====================================================================================================
function responsiveNow(arr, cw){
	for(var n=arr.length-1;n>=0;n--){
		if($(document).width() < arr[n].breakpoint){ // so I use this new settings
			if(cw.usingBreak == n) return false;
			cw.usingBreak = n;
			return arr[n].settings;
		}
	}
	if(cw.usingBreak != -1){
		cw.usingBreak = -1;
		return "stuff";
	} 
	return false;
}

function changeSettings(cw, newSet){
	cw.color = newSet.color;
	cw.opacity = newSet.opacity;
	cw.colorLine = newSet.colorLine;
	cw.opacityLine = newSet.opacityLine;
	cw.opacityRange = newSet.opacityRange;
	cw.countPoints = newSet.countPoints;
	cw.radiusPoint = newSet.radiusPoint;
	cw.radiusMouse = newSet.radiusMouse;
}

$.fn.updateCob = function(){
	for(var k=0;k<numCobweb;k++){
		console.log("aaa");
		console.log(canvas[k].c);
		console.log(this.children()[0]);
		if(canvas[k].c == this.children()[0]){
			console.log("dcs");
			updateCob(canvas[k]);
			var changeSet = responsiveNow(canvas[k].global.responsive, canvas[k]);
			if(changeSet){
				if(canvas[k].usingBreak != -1){
					newSet = $.extend( {}, canvas[k].global, changeSet );
					changeSettings(canvas[ki], newSet);
					var ctx = canvas[k].c.getContext("2d");
					ctx.clearRect(0, 0, canvas[k].c.width, canvas[k].c.height);
					drawCobweb(ctx, canvas[k].cobweb, canvas[k]);
				}else{
					changeSettings(canvas[k], canvas[k].global);
					var ctx = canvas[k].c.getContext("2d");
					ctx.clearRect(0, 0, canvas[k].c.width, canvas[k].c.height);
					drawCobweb(ctx, canvas[k].cobweb, canvas[k]);
				}
			}
			k = numCobweb;
		}	
	}
}
// vado a prendere la width del this. e la piazzo sul figlio dello stesso.
	//var width = this.width();
	//console.log("jckankcjabckajbcaskjcabskjsacbkdcj"+width);
	//console.log("this.children().width"+this.children().width());
	//this.children().width(this.width());
	//console.log("this.children().width"+this.children().width());