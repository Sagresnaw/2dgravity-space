export class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  }
  
  export class Rectangle {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
  
    contains(point) {
      return (
        point.x >= this.x &&
        point.x <= this.x + this.width &&
        point.y >= this.y &&
        point.y <= this.y + this.height
      );
    }
  
    intersects(rect) {
      return !(
        rect.x > this.x + this.width ||
        rect.x + rect.width < this.x ||
        rect.y > this.y + this.height ||
        rect.y + rect.height < this.y
      );
    }
  
    // Check if this rectangle intersects with another range
    intersectsRange(range) {
      return !(
        range.x > this.x + this.width ||
        range.x + range.width < this.x ||
        range.y > this.y + this.height ||
        range.y + range.height < this.y
      );
    }
  }
  
  export class QuadTree {
    constructor(boundary, capacity) {
      this.boundary = boundary;
      this.capacity = capacity;
      this.points = [];
      this.divided = false;
    }
       query(range) {
      const foundPoints = [];
      if (!this.boundary.intersectsRange(range)) {
        return foundPoints;
      }

      for (const point of this.points) {
        if (range.contains(point)) {
          foundPoints.push(point);
        }
      }

      if (this.divided) {
        foundPoints.push(...this.northeast.query(range));
        foundPoints.push(...this.northwest.query(range));
        foundPoints.push(...this.southeast.query(range));
        foundPoints.push(...this.southwest.query(range));
      }

      return foundPoints;
    }
  
  
    insert(point) {
      if (!this.boundary.contains(point)) {
        return;
      }
  
      if (this.points.length < this.capacity) {
        this.points.push(point);
      } else {
        if (!this.divided) {
          this.subdivide();
        }
  
        this.northeast.insert(point);
        this.northwest.insert(point);
        this.southeast.insert(point);
        this.southwest.insert(point);
      }
    }
  
    subdivide() {
      const x = this.boundary.x;
      const y = this.boundary.y;
      const w = this.boundary.width / 2;
      const h = this.boundary.height / 2;
  
      const ne = new Rectangle(x + w, y, w, h);
      const nw = new Rectangle(x, y, w, h);
      const se = new Rectangle(x + w, y + h, w, h);
      const sw = new Rectangle(x, y + h, w, h);
  
      this.northeast = new QuadTree(ne, this.capacity);
      this.northwest = new QuadTree(nw, this.capacity);
      this.southeast = new QuadTree(se, this.capacity);
      this.southwest = new QuadTree(sw, this.capacity);
  
      this.divided = true;
    }
  
    clear() {
      this.points = [];
      this.divided = false;
  
      if (this.northeast) {
        this.northeast.clear();
        this.northwest.clear();
        this.southeast.clear();
        this.southwest.clear();
      }
    }
  }
  