/*
    Demonstration of flocking algorithm, written in JS for ProcessingJS.
    Author: Adrianus Kleemans (a.kleemans@gmail.com)
    Date: Nov 2015

    Neat algorithms - flocking: http://harry.me/blog/2011/02/17/neat-algorithms-flocking/
    Original post: http://www.red3d.com/cwr/boids/
    ProcessingJS reference: http://processingjs.org/reference/

    The algorithm calculates the three forces for flocking for each boid:
     - separation: steer to avoid crowding local flockmates
     - alignment: steer towards the average heading of local flockmates
     - cohesion: steer to move toward the average position of local flockmates
*/

boids = new ArrayList();
int w = 600, h = 400;
PVector v_normal = new PVector(1, 0);
PVector mouse_enemy = new PVector(0, 0);
boolean decorate = false;

int NEIGHBOUR_RADIUS = 60;
int DESIRED_SEPARATION = 15;
int MOUSE_SEPARATION = 30;
float MAX_SPEED = 1.5;
float MAX_FORCE = 0.025;

// weights
float SEPARATION_WEIGHT       = 1;
float ALIGNMENT_WEIGHT        = 0.4;
float COHESION_WEIGHT         = 0.2;
float MOUSE_SEPARATION_WEIGHT = 3;   // FEAR THE ALMIGHTY MOUSE!

/* Setting up canvas and populating boids. */
void setup() {
    smooth();
    size(w, h);
    frameRate(20);
    PImage boid_image = loadImage("bird.png");

    // initiate boids
    int n = 100;
    for (int i = 0; i < n; i++) {
        // radial scattering
        float angle = (i/n) * 2*PI - PI; // angle in range -pi to pi
        PVector speed = new PVector(cos(angle), sin(angle));

        // initial position near center
        PVector pos = new PVector(w/2 + Math.random()*20, h/2 + Math.random()*20);
        Boid b = new Boid(i, boid_image, pos, speed);
        boids.add(b);
    }
}

/* Main loop. */
void draw() {
    // calculate new speed vectors
    for (int i = 0; i < boids.size(); i++) {
        boids.get(i).update();
    }

    // move boids
    for (int i = 0; i < boids.size(); i++) {
        boids.get(i).move();
    }

    // draw
    background(255);
    stroke(0, 0, 0);
    rect(0, 0, w-1, h-1);
    int x, y;

    for (int i = 0; i < boids.size(); i++) {
        Boid b = boids.get(i);
        x = b.pos.x;
        y = b.pos.y;

        pushMatrix();
        translate(x, y);
        rotate(b.rot);
        image(b.img, -b.img_w/2, -b.img_h/2);
        popMatrix();

        noFill();
        if (decorate && b.id == 0) {
            stroke(0, 0, 0);
            ellipse(x, y, NEIGHBOUR_RADIUS*2, NEIGHBOUR_RADIUS*2); // neighbour-radius
            stroke(255, 0, 255);
            line(x, y, x+b.speed.x*20, y+b.speed.y*20);
            stroke(255, 0, 0);
            ellipse(x, y, DESIRED_SEPARATION*2, DESIRED_SEPARATION*2); // separation-radius
        }

        // drawing mouse_enemy
        if (mouse_enemy.mag() > 0) {
            stroke(255, 153, 0);
            ellipse(mouse_enemy.x, mouse_enemy.y, MOUSE_SEPARATION*2, MOUSE_SEPARATION*2);
        }
    }
}

/* Calculates the clockwise angle between two vectors. */
function calculateAngle(PVector a, PVector b) {
    float rot = PVector.angleBetween(a, b);
    if (b.y < 0) rot = 2*PI - rot;
    return rot;
}

/* Correcting malfunctioning % operator for negative numbers. */
function mod(n, m) {
    return ((n % m) + m) % m;
}

/* Mouse input. Sets a gravity field which the boids avoid. */
void mousePressed() {
  if (mouseButton == LEFT) {
      if (mouse_enemy.x == 0 && mouse_enemy.y == 0) {
        mouse_enemy.x = mouseX;
        mouse_enemy.y = mouseY;
      } else {
          mouse_enemy = new PVector(0, 0);
      }
  } else if (mouseButton == RIGHT)  {
      decorate = !decorate;
  }
}

/* Boid class. Represents a flying object which obeys the flocking rules. */
class Boid {
    int id, x, y, img_w = 16, img_h = 16;
    float rot;
    PImage img;
    PVector pos;
    PVector speed;
    PVector alignment, separation, cohesion, mouse_separation;

    Boid(int _id, PImage _img, PVector _pos, PVector _speed) {
        rot = 0;
        id = _id;
        img = _img;
        pos = _pos.get(); // copy
        speed = _speed.get(); // copy
    }

    /* returns a list of neighbours based on distance */
    function neighbours() {
        n = new ArrayList();
        for (int i = 0; i < boids.size(); i++) {
            Boid b = boids.get(i);
            // if neighbour in radius and not self
            if (pos.dist(b.pos) < NEIGHBOUR_RADIUS && id != b.id)
                n.add(b);
        }
        return n;
    }

    /* Updating speed vector */
    void update() {
        /* ----- flocking algorithm ----- */
        n = neighbours();
        PVector acceleration = new PVector(0, 0);

        // alignment: calculate mean speed vector of neighbours
        alignment = new PVector(0, 0);
        for (int i = 0; i < n.size(); i++) {
            alignment.add(n.get(i).speed); // add speed
        }
        if (n.size() > 0) alignment.div(n.size()); // mean speed vector
        alignment.limit(MAX_FORCE);

        // separation
        separation = new PVector(0, 0);
        int count = 0;
        for (int i = 0; i < n.size(); i++) {
            PVector neighbour_pos = n.get(i).pos;
            float d = PVector.dist(pos, neighbour_pos);
            if (d < DESIRED_SEPARATION) {
                PVector repulsion = pos.get();
                repulsion.sub(neighbour_pos);
                repulsion.normalize();
                repulsion.div(d);
                separation.add(repulsion);
                count += 1;
            }
        }
        if (count > 0) separation.div(count);

        // cohesion
        cohesion = new PVector(0, 0);
        for (int i = 0; i < n.size(); i++) {
            cohesion.add(n.get(i).pos);  // add positions
        }
        if (n.size() > 0) {
            cohesion.div(n.size()); // center of mass
            cohesion.sub(pos); // cohesion - pos
            cohesion.limit(MAX_FORCE);
        }

        // mouse_enemy
        mouse_separation = new PVector(0, 0);
        if (mouse_enemy.mag() > 0) {
            float d = PVector.dist(pos, mouse_enemy);
            if (d < MOUSE_SEPARATION) {
                PVector f2 = pos.get();
                f2.sub(mouse_enemy);
                f2.normalize();
                f2.div(d);
                mouse_separation.add(f2);
            }
        }

        // adding it up
        alignment.mult(ALIGNMENT_WEIGHT);
        acceleration.add(alignment);
        separation.mult(SEPARATION_WEIGHT);
        acceleration.add(separation);
        cohesion.mult(COHESION_WEIGHT);
        acceleration.add(cohesion);

        // mouse_enemy
        mouse_separation.mult(MOUSE_SEPARATION_WEIGHT);
        acceleration.add(mouse_separation);

        // update speed vector, limit by MAX_SPEED
        speed.add(acceleration);
        speed.limit(MAX_SPEED);
    }

    /* Moving and resetting rotation */
    void move() {
        pos.x = mod(pos.x + speed.x, w);
        pos.y = mod(pos.y + speed.y, h);

        // calculate angle
        rot = calculateAngle(v_normal, speed);
    }
}
