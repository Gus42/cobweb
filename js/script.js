//$.getScript("js/cobweb.js");//document.getElementById("cobweb1")

$(window).load(function(){
	$(window).resize(function(){

		if($(document).width()<1025){
			$("#due").css("width", "60%");
			//$(canvas).width = $(canvas).parent().width();
			$("#due").updateCob();
		}
				

	});
	//$("#uno").plugCob({ color: "red", colorLine: "red", opacityLine: "random", opacity: "random", distance: 50, countPoints: 6, radiusPoint: 7}); 
	var responsive = [
		{ breakpoint: 1025, settings: { color: "blue", opacityRange: {min: 0.2, max: 0.8} , countPoints: 15, radiusPoint: 3, radiusMouse: 60, distance: 100 }},
		{ breakpoint: 768, settings: { colorLine: "violet" } },
		{ breakpoint: 600, settings: { color: "black", countPoints: 3, opacity: 0 , colorLine: "lime", opacityLine: 0.8} }
	];
	$("#due").plugCob({color: "#ff6600", responsive: responsive, opacityRange: {min: 0.2, max: 0.8}, colorLine: "#ff6600", getResize: true, opacity: "random", left: "auto", opacityLine: 0.2, countPoints: 6, radiusPoint: 7, distance: 30, radiusMouse: 60}); 

	$("#tre").plugCob({ color: "red",opacity: "random", colorLine: "red", opacityLine: "random",distance: 50, countPoints: 6, radiusPoint: 7}); 

	//$("#quattro").plugCob({height: 140, width: 400, color: "yellow",opacity: "random", colorLine: "yellow", opacityLine: "random",distance: 50, countPoints: 6, radiusPoint: 7}); 

	//$("#obj_2").plugCob({left: "-50px", color: "#484848", colorLine: "#484848", opacityLine: "random", opacity: "random", opacityRange: {min:0.2,max:0.5}, distance: 50, countPoints: 5, radiusPoint: 7}); 


});
