/*
    Rewrote my Python script from 2012 to show it on the web.
    Author: Adrianus Kleemans, a.kleemans@gmail.com
    Date: Nov 2015

    Neat algorithms - flocking: http://harry.me/blog/2011/02/17/neat-algorithms-flocking/
    Original post: http://www.red3d.com/cwr/boids/
    ProcessingJS reference: http://processingjs.org/reference/

    Flocking algorithm shows the three forces for flocking:
     - separation: steer to avoid crowding local flockmates
     - alignment: steer towards the average heading of local flockmates
     - cohesion: steer to move toward the average position of local flockmates
*/

boids = new ArrayList();
int w = 600, h = 400;
PVector v_normal = new PVector(1, 0);
PVector mouse_enemy = new PVector(0, 0);

int NEIGHBOUR_RADIUS = 60;
int MAX_SPEED = 1.5;
int MAX_FORCE = 0.04; // 0.05
int DESIRED_SEPARATION = 15; // 20
int MOUSE_SEPARATION = 30;

decorate = new Boolean(false);

int separation_weight       = 1;   // 3
int alignment_weight        = 0.4; // 0.5
int cohesion_weight         = 0.2; // 0.3
int mouse_separation_weight = 3;   // FEAR THE ALMIGHTY MOUSE!

void setup() {
    smooth();
    size(w, h);
    frameRate(20);
    PImage boid_image = loadImage("bird.png");

    PVector pos = new PVector(w/2, h/2);

    // fill boids
    int n = 80;
    for (int i = 0; i < n; i++) {
        PVector speed = new PVector(i/(n*5)-0.1, i/(n*5)-0.1);
        Boid b = new Boid(i, boid_image, pos, speed);
        boids.add(b);
    }
}

// main loop
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

    for (int i = 0; i < boids.size(); i++) {
        Boid b = boids.get(i);
        x = b.pos.x;
        y = b.pos.y;

        pushMatrix();
        translate(x, y);
        rotate(b.rot);
        image(b.img, -b.img_w/2, -b.img_h/2);
        popMatrix();

        if (b.id == 0) {
            noFill();
            if (decorate) {
                stroke(0, 0, 0);
            } else {
                stroke(0, 255, 0);
            }
            ellipse(x, y, NEIGHBOUR_RADIUS*2, NEIGHBOUR_RADIUS*2); // neighbour-radius

            stroke(255, 0, 255);
            line(x, y, x+b.speed.x*20, y+b.speed.y*20);
            stroke(255, 0, 0);
            line(x, y, x+b.alignment.x*100, y+b.alignment.y*100);
            ellipse(x, y, DESIRED_SEPARATION*2, DESIRED_SEPARATION*2); // separation-radius

            stroke(0, 255, 0);
            line(x, y, x+b.cohesion.x*100, y+b.cohesion.y*100);
            stroke(0, 0, 255);
            line(x, y, x+b.separation.x*100, y+b.separation.y*100);
            stroke(0, 0, 0);
        }

        // mouse_enemy
        if (mouse_enemy.mag() > 0) {
            stroke(128, 0, 128);
            ellipse(mouse_enemy.x, mouse_enemy.y, MOUSE_SEPARATION*2, MOUSE_SEPARATION*2);
        }
    }
}

float calculateAngle(PVector a, PVector b) {
    float rot = PVector.angleBetween(a, b);
    if (b.y < 0) {
        rot = 2*PI - rot;
     }
     return rot;
}

function mod(n, m) {
    return ((n % m) + m) % m;
}

PVector roundVector(v) {
    v.x = Math.round(v.x * 100) / 100;
    v.y = Math.round(v.y * 100) / 100;
    return v;
}

/*
 * Mouse input. Sets a gravity field which the boids avoid.
 */
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

/*
 * Boid class. Represents a flying object which obeys the flocking rules.
 */

 class Boid {
    int id, x, y, img_w = 16, img_h = 16;
    float rot;
    PImage img;
    PVector pos;
    PVector speed;

    PVector alignment, separation, cohesion;

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
            if (pos.dist(b.pos) < NEIGHBOUR_RADIUS && id != b.id)
                n.add(b);
        }
        return n;
    }

    /* Updating speed vector */
    void update() {
        n = neighbours();
        /* ----- flocking algorithm ----- */
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
            PVector f = n.get(i).pos;
            float d = PVector.dist(pos, f);

            if (d > 0 && d < DESIRED_SEPARATION) {
                PVector f2 = pos.get();
                f2.sub(f);
                //f.sub(pos);
                f2.normalize();
                f2.div(d);
                separation.add(f2);
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

            if (decorate) {
                d = cohesion.mag();
                cohesion.normalize();
                // damping
                if (d < 100.0) {
                  cohesion.mult(MAX_SPEED * (d / 100.0));
                } else {
                  cohesion.mult(MAX_SPEED);
                }
                cohesion.sub(speed);
            }

            cohesion.limit(MAX_FORCE);
        }

        // mouse_enemy
        PVector mouse_separation = new PVector(0, 0);
        if (mouse_enemy.mag() > 0) {
            float d = PVector.dist(pos, mouse_enemy);

            if (d > 0 && d < MOUSE_SEPARATION) {
                PVector f2 = pos.get();
                f2.sub(mouse_enemy);
                f2.normalize();
                f2.div(d);
                mouse_separation.add(f2);
            }
        }

        /*
        if (id == 0) {
            println('Forces: al = ' + roundVector(alignment) + ', sep = ' + roundVector(separation) + ', co = ' + roundVector(cohesion));
        }
        */

        // adding it up
        alignment.mult(alignment_weight);
        acceleration.add(alignment);
        separation.mult(separation_weight);
        acceleration.add(separation);
        cohesion.mult(cohesion_weight);
        acceleration.add(cohesion);

        // mouse_enemy
        mouse_separation.mult(mouse_separation_weight);
        acceleration.add(mouse_separation);

        // update speed vector, limit by MAX_SPEED
        speed.add(acceleration);
        speed.limit(MAX_SPEED);
    }

    /* Moving and resetting rotation*/
    void move() {
        pos.add(speed);

        pos.x = mod(pos.x, w);
        pos.y = mod(pos.y, h);

        // calculate angle
        rot = calculateAngle(v_normal, speed);
    }
}
