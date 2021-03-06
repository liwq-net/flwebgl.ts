/// <reference path="../events/Event.ts" />
/// <reference path="../geom/ColorTransform.ts" />
/// <reference path="../geom/Matrix.ts" />
/// <reference path="../geom/Point.ts" />
/// <reference path="../geom/Rect.ts" />
/// <reference path="../e/Mesh.ts" />
/// <reference path="../e/MeshInstanced.ts" />
/// <reference path="../e/IRenderable.ts" />
/// <reference path="IDisplayObjectDefinition.ts" />
/// <reference path="DisplayObject.ts" />

module flwebgl.sg
{
  import Event = flwebgl.events.Event;
  import ColorTransform = flwebgl.geom.ColorTransform;
  import Matrix = flwebgl.geom.Matrix;
  import Point = flwebgl.geom.Point;
  import Rect = flwebgl.geom.Rect;
  import Mesh = flwebgl.e.Mesh;
  import MeshInstanced = flwebgl.e.MeshInstanced;
  import IRenderable = flwebgl.e.IRenderable;
  import IDisplayObjectDefinition = flwebgl.sg.IDisplayObjectDefinition;

  export class Shape extends DisplayObject
  {
    yc: Mesh;
    mf: MeshInstanced;

    constructor() {
      super();
      this.mf = new MeshInstanced(this);
    }

    getDefinition(): IDisplayObjectDefinition {
      return this.yc;
    }

    setDefinition(obj: IDisplayObjectDefinition) {
      this.yc = <Mesh>obj;
    }

    collectRenderables(renderables: IRenderable[]) {
      if (this.isVisible()) {
        this.mf.dirty = this.dirty;
        renderables.push(this.mf);
      }
      this._dirty = false;
    }

    getBounds(target: DisplayObject = this, fast: boolean = true, edgeType: string = Mesh.EXTERNAL, k: boolean = false): Rect {
      var targetConcat: Matrix;
      var thisConcat: Matrix;
      if (k === true) {
        targetConcat = target.getGlobalTransform(); // TODO: not used?
        thisConcat = this.getGlobalTransform();
      } else {
        targetConcat = new Matrix();
        var dobj = target;
        while (dobj) {
          targetConcat.concat(dobj.getLocalTransform());
          dobj = dobj.parent;
        }
        targetConcat.invert();
        thisConcat = new Matrix();
        dobj = this;
        while (dobj) {
          thisConcat.concat(dobj.getLocalTransform());
          dobj = dobj.parent;
        }
        thisConcat.concat(targetConcat);
      }
      return fast
           ? thisConcat.transformBoundsAABB(this.yc.bounds)
           : this.calculateBoundsAABB(edgeType, thisConcat);
    }

    calculateBoundsAABB(a, transform): Rect {
      var bounds = new Rect();
      var k = this.yc.getGeometryCount(a);
      var p = new Point(0, 0);
      for (var i = 0; i < k; i++) {
        var m = this.yc.getGeometry(a, i);
        var atlasIDs = m.getAtlasIDs();
        var vertexDataArr = m.getVertexData(atlasIDs[0]);
        for (var j = 0; j < vertexDataArr.length; j++) {
          var vertexData = vertexDataArr[j];
          var attrs = vertexData.attributeDefs.attrs;
          for (var k = 0; k < attrs.length; k++) {
            var attr = attrs[k];
            if (attr.name === "POSITION0") {
              var vertices = vertexData.vertices;
              var stride = vertexData.attributeDefs.totalSize / Float32Array.BYTES_PER_ELEMENT;
              for (var q = attr.byteOffset / Float32Array.BYTES_PER_ELEMENT; q < vertices.length; q += stride) {
                p.x = vertices[q];
                p.y = vertices[q + 1];
                p = transform.transformPoint(p);
                bounds.expand(p.x, p.y);
              }
              break;
            }
          }
        }
      }
      return bounds;
    }

    dispatch(event: Event) {
      super.dispatch(event);
      if (this.parent && event.bubbles && !event._stopped) {
        this.parent.dispatch(event);
      }
    }

    destroy() {
      this.id = "-1";
      this.parent = void 0;
      this.yc = void 0;
      this.mf.destroy();
    }
  }
}
