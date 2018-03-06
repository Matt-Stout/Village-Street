// canvas size
var xsize = 400;
var ysize = 400;

var m4 = twgl.m4;
var v3 = twgl.v3;

// make the sliders
var sliders = [["walk", 10, 40, 40], ["turn", -4, 4, 0], ["cross", -4, 4, 0]];
sliders.forEach(function (s) {
    "use strict";
    if (s[0] === "walk") {
        document.write("<span style='display: inline-block; width: 180px;'>Walk down the street </span>")
    }
    else if (s[0] === "turn") {
        document.write("<span style='display: inline-block; width: 180px;'>Turn your head </span>")
    }
    else if (s[0] === "cross") {
        document.write("<span style='display: inline-block; width: 180px;'>Cross the street </span>")
    }
    document.write("<input id=\"" + s[0] + "\" type=\"range\" width=\"300\" " + "min=\"" + s[1] + "\" " + "max=\"" + s[2] + "\" " + "></input><br/>");
});

// quick calculation from degrees to radians
function toRadians(a) {
    "use strict";
    return a / 180 * Math.PI;
}

/**
 * an object with a list of all the triangles to be mapped to the context to draw
 */
function TriangleMapper(canvas, context) {
    this.triangles = [];
    this.canvas = canvas;
    this.context = context || canvas.getContext('2d');
}

/**
 * clears the set of triangles
 */
TriangleMapper.prototype.clear = function () {
    this.triangles = [];
};

// the triangle thing is tricky, since we don't know how many parameters
// we assume that we pass points as some kind of array-like thingy
// we don't assume that the colors are passed - but we'll always assign
/**
 * adds a triangle to the list 
 */
TriangleMapper.prototype.triangle = function (vertex1, vertex2, vertex3, fill, stroke) {
    this.triangles.push(
        {
            "v1": vertex1,
            "v2": vertex2,
            "v3": vertex3,
            "fill": fill || "blue",
            "stroke": stroke,
            "zmax": Math.max(vertex1[2], vertex2[2], vertex3[2]),
            "zsum": vertex1[2] + vertex2[2] + vertex3[2]
        }
    )
};

/**
 * draws the triangles into the context
 */
TriangleMapper.prototype.render = function () {
    var thisHolder = this;

    this.triangles.sort(function (a, b) {
        if (a.zsum > b.zsum) {
            return -1;
        } else {
            return 1;
        }
    });

    this.triangles.forEach(function (tri) {
        thisHolder.context.beginPath();
        thisHolder.context.fillStyle = tri.fill;
        thisHolder.context.strokeStyle = tri.stroke || "black";
        thisHolder.context.moveTo(tri.v1[0], tri.v1[1]);
        thisHolder.context.lineTo(tri.v2[0], tri.v2[1]);
        thisHolder.context.lineTo(tri.v3[0], tri.v3[1]);
        thisHolder.context.closePath();
        thisHolder.context.fill();
        if (tri.stroke) {
            thisHolder.context.stroke()
        }
    });
};

function setup() {
    "use strict";

    var mySliders = {};
    var myCanvas = document.getElementById("myCanvas");
    var context = myCanvas.getContext('2d');
    var triangleMapper = new TriangleMapper(myCanvas);

    var buildingVertices1 = [[0, 0, 0], [5, 0, 0], [5, 10, 0], [0, 10, 0], [0, 0, 10], [5, 0, 10], [5, 10, 10], [0, 10, 10]];
    var buildingVertices2 = [[0, 0, 0], [5, 0, 0], [5, 5, 0], [0, 5, 0], [0, 0, 10], [5, 0, 10], [5, 5, 10], [0, 5, 10]];
    var buildingTriangles = [
        [3, 2, 7], [2, 6, 7],  // top is   2,3,6,7
        [0, 1, 2], [0, 2, 3],  // front is 0,1,2,3
        [1, 5, 2], [5, 2, 6],  // side is  1,2,5,6
        [4, 5, 6], [4, 6, 7],  // back is  4,5,6,7
        [4, 0, 3], [4, 3, 7],  // side is  0,3,4,7
        [0, 1, 4], [1, 4, 5]   // bottom is 0,1,4,5
    ];

    function drawBuilding(num, viewProj, model, redValue, greenValue, blueValue, emphasis) {
        var buildingVertices;
        if (num == 1) {
            buildingVertices = buildingVertices1;
            redValue = redValue || 165;
            blueValue = blueValue || 30;
            greenValue = greenValue || 30;
        }
        else {
            buildingVertices = buildingVertices2;
            redValue = redValue || 72;
            blueValue = blueValue || 209;
            greenValue = greenValue || 204;
        }


        emphasis = emphasis || 10;
        model = model || m4.identity();
        var dir = v3.normalize([1, 3, 2]);
        for (var i = 0; i < buildingTriangles.length; i++) {

            var t = buildingTriangles[i];
            var p1 = m4.transformPoint(model, buildingVertices[t[0]]);
            var p2 = m4.transformPoint(model, buildingVertices[t[1]]);
            var p3 = m4.transformPoint(model, buildingVertices[t[2]]);

            // compute the normal
            var e1 = v3.subtract(p1, p2);
            var e2 = v3.subtract(p1, p3);
            var n = v3.normalize(v3.cross(e1, e2));

            var p1 = m4.transformPoint(viewProj, p1);
            var p2 = m4.transformPoint(viewProj, p2);
            var p3 = m4.transformPoint(viewProj, p3);

            var r, g, b;

            r = redValue + (i % 2) * emphasis;
            g = greenValue + (i % 2) * emphasis;
            b = blueValue;

            var l = .5 + Math.abs(v3.dot(n, dir));
            r = r * l;
            g = g * l;
            b = b * l;

            var color = "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";


            triangleMapper.triangle(p1, p2, p3, color);
        };

    }

    var roofVertices = [[0, 0, 0], [5, 0, 0], [5, 2.5, 5], [0, 2.5, 5], [0, 0, 10], [5, 0, 10]];
    var roofTriangles = [
        [0, 1, 3], [1, 3, 2],   // top side1 is     0,1,2,3
        [3, 5, 2], [5, 3, 4],   // top side2 is     2,3,4,5
        [0, 3, 4],              // front is         0,3,4
        [1, 2, 5],              // back is          1,2,5
        [0, 1, 4], [1, 4, 5]    // bottom is        0,1,4,5
    ];

    function drawRoof(viewProj, model, redValue, greenValue, blueValue, emphasis) {

        redValue = redValue || 105;
        blueValue = blueValue || 42;
        greenValue = greenValue || 42;
        emphasis = emphasis || 10;
        model = model || m4.identity();
        var dir = v3.normalize([1, 3, 2]);
        for (var i = 0; i < roofTriangles.length; i++) {

            var t = roofTriangles[i];
            var p1 = m4.transformPoint(model, roofVertices[t[0]]);
            var p2 = m4.transformPoint(model, roofVertices[t[1]]);
            var p3 = m4.transformPoint(model, roofVertices[t[2]]);

            // compute the normal
            var e1 = v3.subtract(p1, p2);
            var e2 = v3.subtract(p1, p3);
            var n = v3.normalize(v3.cross(e1, e2));

            var p1 = m4.transformPoint(viewProj, p1);
            var p2 = m4.transformPoint(viewProj, p2);
            var p3 = m4.transformPoint(viewProj, p3);

            var r, g, b;

            r = redValue + (i % 2) * emphasis;
            g = greenValue + (i % 2) * emphasis;
            b = blueValue;

            var l = .5 + Math.abs(v3.dot(n, dir));
            r = r * l;
            g = g * l;
            b = b * l;

            var color = "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";

            triangleMapper.triangle(p1, p2, p3, color);
        };

    }

    function draw() {
        myCanvas.width = myCanvas.width; //clear canvas

        var viewport = m4.scaling([xsize / 2, -ysize / 2, 1]); // set viewport
        m4.setTranslation(viewport, [xsize / 2, ysize / 2, 0], viewport);

        var fov = toRadians(mySliders.walk.value);
        var projection = m4.perspective(fov, 1, 0.1, 100);

        // lookat camera matrix
        var lookAtPoint = [mySliders.turn.value, 4, -30]; // original z value = mySliders.lookAtZ.value
        var lookFromPoint = [mySliders.cross.value, 4, 15]; // original z value = 15
        var lookatInverse = m4.lookAt(lookFromPoint, lookAtPoint, [0, 1, 0]);
        var lookatMatrix = m4.inverse(lookatInverse);

        // the whole transform
        var viewi = m4.multiply(lookatMatrix, projection);
        var view = m4.multiply(viewi, viewport);

        triangleMapper.clear(); // clear painter object

        // draw road
        var x, z;
        for (x = -2; x < 2; x += 2) {
            for (z = -200; z < 10; z += 2) {
                var corner1 = m4.transformPoint(view, [x, 0, z]);
                var corner2 = m4.transformPoint(view, [x, 0, z + 2]);
                var corner3 = m4.transformPoint(view, [x + 2, 0, z + 2]);
                var corner4 = m4.transformPoint(view, [x + 2, 0, z]);
                triangleMapper.triangle(corner1, corner2, corner3, ((x + z) % 2) ? "#888" : "#CCC");
                triangleMapper.triangle(corner1, corner3, corner4, ((x + z) % 2) ? "#999" : "#DDD");
            }
        }

        // draw grass
        for (x = -52; x < -2; x += 5) {
            for (z = -200; z < 10; z += 5) {
                var corner1 = m4.transformPoint(view, [x, 0, z]);
                var corner2 = m4.transformPoint(view, [x, 0, z + 5]);
                var corner3 = m4.transformPoint(view, [x + 5, 0, z + 5]);
                var corner4 = m4.transformPoint(view, [x + 5, 0, z]);
                triangleMapper.triangle(corner1, corner2, corner3, ((x + z) % 2) ? "#0F0" : "#3F1");
                triangleMapper.triangle(corner1, corner3, corner4, ((x + z) % 2) ? "#0F5" : "#5F0");
            }
        }
        for (x = 2; x < 52; x += 5) {
            for (z = -200; z < 10; z += 5) {
                var corner1 = m4.transformPoint(view, [x, 0, z]);
                var corner2 = m4.transformPoint(view, [x, 0, z + 5]);
                var corner3 = m4.transformPoint(view, [x + 5, 0, z + 5]);
                var corner4 = m4.transformPoint(view, [x + 5, 0, z]);
                triangleMapper.triangle(corner1, corner2, corner3, ((x + z) % 2) ? "#0F0" : "#3F1");
                triangleMapper.triangle(corner1, corner3, corner4, ((x + z) % 2) ? "#0F5" : "#5F0");
            }
        }

        var ctr = m4.translation([-.5, -.5, -.5]);

        // draw buildings
        drawBuilding(1, view, m4.translation([5, 0, -10]));
        drawBuilding(1, view, m4.translation([-10, 0, -10]));
        drawBuilding(2, view, m4.translation([5, 0, -25]));
        drawBuilding(2, view, m4.translation([-10, 0, -25]));
        drawRoof(view, m4.translation([5, 5, -25]));
        drawRoof(view, m4.translation([-10, 5, -25]));
        drawBuilding(1, view, m4.translation([5, 0, -50]));
        drawBuilding(1, view, m4.translation([-10, 0, -50]));
        drawBuilding(2, view, m4.translation([5, 0, -75]));
        drawBuilding(2, view, m4.translation([-10, 0, -75]));
        drawRoof(view, m4.translation([5, 5, -75]));
        drawRoof(view, m4.translation([-10, 5, -75]));
        drawBuilding(1, view, m4.translation([5, 0, -100]));
        drawBuilding(1, view, m4.translation([-10, 0, -100]));
        drawBuilding(2, view, m4.translation([5, 0, -125]));
        drawBuilding(2, view, m4.translation([-10, 0, -125]));
        drawRoof(view, m4.translation([5, 5, -125]));
        drawRoof(view, m4.translation([-10, 5, -125]));
        drawBuilding(1, view, m4.translation([5, 0, -150]));
        drawBuilding(1, view, m4.translation([-10, 0, -150]));
        drawBuilding(2, view, m4.translation([5, 0, -175]));
        drawBuilding(2, view, m4.translation([-10, 0, -175]));
        drawRoof(view, m4.translation([5, 5, -175]));
        drawRoof(view, m4.translation([-10, 5, -175]));

        triangleMapper.render();

        window.requestAnimationFrame(draw);
    }

    // set up the sliders before drawing
    sliders.forEach(function (s) {
        var sl = document.getElementById(s[0]);
        sl.value = s[3];
        mySliders[s[0]] = sl;
    });

    window.requestAnimationFrame(draw);;
}
window.onload = setup;