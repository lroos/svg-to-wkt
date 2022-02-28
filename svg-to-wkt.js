
/**
 * SVG-to-WKT.js
 *
 * @package     svg-to-wkt
 * @copyright   2012 David McClure
 * @license     http://www.apache.org/licenses/LICENSE-2.0.html
 */


(function() {
  var SVGNS = 'http://www.w3.org/2000/svg';
  var SVGtoWKT = {};

  /**
   * The number of decimal places computed during curve interpolation when
   * generating points for `<circle>`, `<ellipse>`, and `<path>` elements.
   *
   * @public
   */
  SVGtoWKT.PRECISION = 3;

  /**
   * The number of points computed during curve interpolation per unit of
   * linear pixel length. For example, if a a path is 10px in length, and
   * `DENSITY` is set to 2, the path will be rendered with 20 points.
   *
   * @public
   */
  SVGtoWKT.DENSITY = 1;

  /**
   * SVG => WKT.
   *
   * @param {String} svg: SVG markup.
   * @return {String}: Generated WKT.
   *
   * @public
   */
  SVGtoWKT.convert = function(svg) {

    var xml = __getXml(svg);
    var els = [];

    // Match `<polygon>` elements.
    xml.find('polygon').each(function(i, polygon) {
      els.push(__createWKT(polygon));
    });

    // Match `<polyline>` elements.
    xml.find('polyline').each(function(i, polyline) {
      els.push(__createWKT(polyline));
    });

    // Match `<line>` elements.
    xml.find('line').each(function(i, line) {
      els.push(__createWKT(line));
    });

    // Match `<rect>` elements.
    xml.find('rect').each(function(i, rect) {
      els.push(__createWKT(rect));
    });

    // Match `<circle>` elements.
    xml.find('circle').each(function(i, circle) {
      els.push(__createWKT(circle));
    });

    // Match `<ellipse>` elements.
    xml.find('ellipse').each(function(i, ellipse) {
      els.push(__createWKT(ellipse));
    });

    // Match `<path>` elements.
    xml.find('path').each(function(i, path) {
      els.push(__createWKT(path));
    });

    var spaces = [];

    xml.find('[id]').each(function(i, element) {
      const $shape = $(element);
      spaces.push({
        id: $shape.attr('id'),
        title: $shape.attr('title'),
        space: __createWKT(element)
      })
    });

    response = {
      detail: 'GEOMETRYCOLLECTION(' + els.join(',') + ')',
      spaces: spaces
    };

    return JSON.stringify(response);
  };

  __createWKT = function(element) {
    const $element = $(element);
    switch (element.nodeName) {
      case 'polygon':
        return SVGtoWKT.polygon($element.attr('points'))
      case 'polyline':
        return SVGtoWKT.polyline($element.attr('points'));
        case 'line':
        return SVGtoWKT.line(
          parseFloat($element.attr('x1')),
          parseFloat($element.attr('y1')),
          parseFloat($element.attr('x2')),
          parseFloat($element.attr('y2'))
        );
        case 'rect':
        return SVGtoWKT.rect(
          parseFloat($element.attr('x')),
          parseFloat($element.attr('y')),
          parseFloat($element.attr('width')),
          parseFloat($element.attr('height'))
        );
        case 'circle':
        return SVGtoWKT.circle(
          parseFloat($element.attr('cx')),
          parseFloat($element.attr('cy')),
          parseFloat($element.attr('r'))
        );
        case 'ellipse':
        return SVGtoWKT.ellipse(
          parseFloat($element.attr('cx')),
          parseFloat($element.attr('cy')),
          parseFloat($element.attr('rx')),
          parseFloat($element.attr('ry'))
        );
        case 'path':
        return SVGtoWKT.path($element.attr('d'));
      default:
        return 'EMPTY';
    }
  };

  /**
   * SVG => WKT.
   *
   * @param {String} svg: SVG markup.
   * @return {JQuery<XMLDocument>}: Generated WKT.
   *
   * @public
   */
  __getXml = function(svg) {
    // Halt if svg is undefined or empty.
    if (_.isUndefined(svg) || _.isEmpty(svg.trim())) {
      throw new Error('Empty XML.');
    }

    var els = [];
    var xml;

    // Strip out tabs and linebreaks.
    svg = svg.replace(/\r\n|\r|\n|\t/g, '');

    try {
      // Parse the raw XML.
      xml = $($.parseXML(svg));
    } catch (e) {
      // Halt if malformed.
      throw new Error('Invalid XML.');
    }

    return xml;
  }

  /**
   * Construct a WKT line from SVG start/end point coordinates.
   *
   * @param {Number} x1: Start X.
   * @param {Number} y1: Start Y.
   * @param {Number} x2: End X.
   * @param {Number} y2: End Y.
   * @return {String}: Generated WKT.
   *
   * @public
   */
  SVGtoWKT.line = function(x1, y1, x2, y2) {
    return 'LINESTRING('+x1+' '+-y1+','+x2+' '+-y2+')';
  };

  /**
   * Construct a WKT linestrimg from SVG `points` attribute value.
   *
   * @param {String} points: <polyline> `points` attribute value.
   * @return {String}: Generated WKT.
   *
   * @public
   */
  SVGtoWKT.polyline = function(points) {

    // "1,2 3,4 " => "1 2,3 4"
    var pts = _.map(points.trim().split(' '), function(pt) {
      pt = pt.split(','); pt[1] = -pt[1];
      return pt.join(' ');
    });

    return 'LINESTRING(' + pts.join() + ')';
  };

  /**
   * Construct a WKT polygon from SVG `points` attribute value.
   *
   * @param {String} points: <polygon> `points` attribute value.
   * @return {String}: Generated WKT.
   *
   * @public
   */
  SVGtoWKT.polygon = function(points) {

    // "1,2 3,4 " => "1 2,3 4"
    var pts = _.map(points.trim().split(' '), function(pt) {
      pt = pt.split(',');
      pt[1] = -pt[1];
      return pt.join(' ');
    });

    // Close.
    pts.push(pts[0]);

    return 'POLYGON((' + pts.join() + '))';
  };

  /**
   * Construct a WKT polygon from SVG rectangle origin and dimensions.
   *
   * @param {Number} x: Top left X.
   * @param {Number} y: Top left Y.
   * @param {Number} width: Rectangle width.
   * @param {Number} height: Rectangle height.
   * @return {String}: Generated WKT.
   *
   * @public
   */
  SVGtoWKT.rect = function(x, y, width, height) {

    var pts = [];

    // 0,0 origin by default.
    if (!_.isNumber(x)) x = 0;
    if (!_.isNumber(y)) y = 0;

    // No corner rounding.
    pts.push(String(x)+' '+String(-y));              // top left
    pts.push(String(x+width)+' '+String(-y));        // top right
    pts.push(String(x+width)+' '+String(-y-height)); // bottom right
    pts.push(String(x)+' '+String(-y-height));       // bottom left
    pts.push(String(x)+' '+String(-y));              // close

    // TODO: Corner rounding.

    return 'POLYGON((' + pts.join() + '))';
  };

  /**
   * Construct a WKT polygon for a circle from origin and radius.
   *
   * @param {Number} cx: Center X.
   * @param {Number} cy: Center Y.
   * @param {Number} r: Radius.
   * @return {String} wkt: Generated WKT.
   *
   * @public
   */
  SVGtoWKT.circle = function(cx, cy, r) {

    var wkt = '(';
    var pts = [];

    // Generate the circle.
    for (var i = 0; i < 5; i++) {
      var angle = (90 * i) * (Math.PI / 180);
      var x = __round(cx + r * Math.cos(angle));
      var y = __round(cy + r * Math.sin(angle));
      pts.push(`${x} ${-y}`);
    };

    return `CIRCULARSTRING(${pts.join()})`;
  };

  /**
   * Construct a WKT polygon for an ellipse from origin and radii.
   *
   * @param {Number} cx: Center X.
   * @param {Number} cy: Center Y.
   * @param {Number} rx: Horizontal radius.
   * @param {Number} ry: Vertical radius.
   * @return {String} wkt: Generated WKT.
   *
   * @public
   */
  SVGtoWKT.ellipse = function(cx, cy, rx, ry) {

    var wkt = 'POLYGON((';
    var pts = [];

    // Approximate the circumference.
    var circumference = 2 * Math.PI * Math.sqrt(
      (Math.pow(rx, 2) + Math.pow(ry, 2)) / 2
    );

    // Compute number of points and angle between points.
    var point_count = Math.round(circumference * SVGtoWKT.DENSITY);
    var interval_angle = 360 / point_count;

    // Generate the ellipse.
    _(point_count).times(function(i) {
      var angle = (interval_angle * i) * (Math.PI / 180);
      var x = __round(cx + rx * Math.cos(angle));
      var y = __round(cy + ry * Math.sin(angle));
      pts.push(String(x)+' '+String(-y));
    });

    // Close.
    pts.push(pts[0]);

    return wkt + pts.join() + '))';
  };

  /**
   * Construct a WKT polygon from a SVG path string. Approach from:
   * http://whaticode.com/2012/02/01/converting-svg-paths-to-polygons/
   *
   * @param {String} d: <path> `d` attribute value.
   * @return {String}: Generated WKT.
   *
   * @public
   */
  SVGtoWKT.path = function(d) {

    // Try to extract polygon paths closed with 'Z'.
    var polys = _.map(d.trim().match(/[^z|Z]+[z|Z]/g), function(p) {
      return __pathElement(p.trim()).getPathData();
    });

    // If closed polygon paths exist, construct a `POLYGON`.
    if (!_.isEmpty(polys)) {

      var parts = [];
      _.each(polys, function(poly) {
        var curve = __curveString(poly)
        if (poly.some(p => p.type == 'A') && poly.some(p => !['M', 'A', 'Z'].includes(p.type))) {
          curve = `COMPOUNDCURVE(${curve})`;
        }
        parts.push(curve);
      });

      if (polys.some(p => p.some(p2 => p2.type == 'A'))) {
        return `CURVEPOLYGON(${parts.join()})`;
      } else {
        // Prevent < 4 point linear polygon
        if (polys.some(p => p.length < 5)) {
          return `LINESTRING EMPTY`;
        }
        return `POLYGON(${parts.join()})`;
      }
    }

    // Otherwise, construct a `LINESTRING` from the unclosed path.
    else {
      var line = __pathElement(d);
      var data = line.getPathData();

      let curveGroups = [];

      for (const command of data) {
        if (command.type == 'M') {
          curveGroups.push([command]);
        } else {
          curveGroups[curveGroups.length - 1].push(command);
        }
      }

      let multiLines = curveGroups.filter(g => !g.some(c => c.type == 'A'));
      let compoundCurves = curveGroups.filter(g => g.some(c => c.type == 'A'));

      let geometry = [];

      if (multiLines.length > 1) {
        const lines = multiLines.map(m => __curveString(m)).join();
        geometry.push(`MULTILINESTRING(${lines})`);
      }
      else if (multiLines.length > 0) {
        geometry.push(`LINESTRING${__curveString(multiLines[0])}`);
      }

      for (path of compoundCurves) {
        geometry.push(`COMPOUNDCURVE(${__curveString(path)})`)
      }

      return geometry.join();
    }
  };

  /**
   * Construct a SVG path element.
   *
   * @param {String} d: <path> `d` attribute value.
   * @return {SVGPathElement}: The new <path> element.
   *
   * @private
   */
  var __pathElement = function(d) {
    var path = document.createElementNS(SVGNS, 'path');
    path.setAttributeNS(null, 'd', d);
    return path;
  };

  var __curveString = function(curves) {
    var linePts = [];
    var geometries = [];
    var firstPt = null;
    var lastPt = {x: 0, y: 0};

    for (const step of curves) {
      switch (step.type) {
        case 'M':
          // Move pen
          break;
        case 'L':
          if (linePts.length == 0) {
            linePts.push(lastPt);
          }
          linePts.push(__ptFromValues(step.values));
          break;
        case 'Z':
          // Close by returning to start
          if (firstPt && lastPt && !(firstPt.x == lastPt.x && firstPt.y == lastPt.y)) {
            linePts.push(firstPt);
          }
          continue;
        case 'A':
        default:
          const pathData = `M ${lastPt.x} ${lastPt.y} ${step.type} ${step.values.join(" ")}`;
          const mockElement = __pathElement(pathData);

          if (step.type === 'A' && step.values[0] == step.values[1]) {
            if (linePts.length > 0) {
              geometries.push(__lineString(linePts));
            }
            // Circular arc case
            const length = mockElement.getTotalLength();
            const midPoint = mockElement.getPointAtLength(length / 2);
            const endPoint = __ptFromValues(step.values);
            geometries.push(__circularString(lastPt, midPoint, endPoint));
          } else {
            // All other cases, e.g. bezier, quadratic curves
            const shapePts = __interpolatedPoints(mockElement);
            linePts = linePts.concat(shapePts);
          }
          break;
      }

      if (step.values.length >= 2) {
        lastPt = __ptFromValues(step.values);
      }

      if (!firstPt) {
        firstPt = lastPt
      }
    }

    // At least two points per line
    if (linePts.length > 1) {
      geometries.push(__lineString(linePts));
    }

    // At least one part per multi curve
    return geometries.length ? geometries.join() : ' EMPTY';
  }

  var __ptFromValues = function(values) {
    return new DOMPointReadOnly(values[values.length - 2], values[values.length - 1]);
  }

  var __lineString = function(points) {
    return `(${points.map(p => `${p.x} ${-p.y}`).join()})`;
  }

  var __circularString = function(startPt, midPt, endPt) {
    return `CIRCULARSTRING(${startPt.x} ${-startPt.y}, ${midPt.x} ${-midPt.y}, ${endPt.x} ${-endPt.y})`;
  }

 /**
   * Construct a SVG path element.
   *
   * @param {SVGPathElement} path: A <path> element.
   * @return array: An array of { x, y } coords.
   *
   * @private
   */
  var __interpolatedPoints = function(path) {
    var pts = [];

    // Get number of points.
    var length = path.getTotalLength();
    var count = Math.round(length * SVGtoWKT.DENSITY);

    // Interpolate points.
    _(count + 1).times(function(i) {
      var point = path.getPointAtLength((length * i) / count);
      pts.push({x: __round(point.x), y: __round(point.y)});
    });

    return pts;
  }

  /**
   * Round a number to the number of decimal places in `PRECISION`.
   *
   * @param {Number} val: The number to round.
   * @return {Number}: The rounded value.
   *
   * @private
   */
  var __round = function(val) {
    var root = Math.pow(10, SVGtoWKT.PRECISION);
    return Math.round(val * root) / root;
  };

  this.SVGtoWKT = SVGtoWKT;

}.call(this));
