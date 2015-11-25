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
int local_radius = 60;
int max_speed = 2;
int max_force = 0.2;
int desired_separation = 20;

int separation_weight = 3;
int alignment_weight  = 0.5;
int cohesion_weight   = 0.3;

void setup() {
    //smooth ?
    size(w, h);
    frameRate(30);
    PImage boid_image = loadImage("bird.png");

    PVector pos = new PVector(w/2, h/2);

    /*
    PVector speed = new PVector(0.4, 0.3);
    Boid b = new Boid(0, boid_image, pos, speed);
    boids.add(b);

    speed = new PVector(0.3, -0.2);
    b = new Boid(1, boid_image, pos, speed);
    boids.add(b);

    speed = new PVector(-0.35, 0.3);
    b = new Boid(2, boid_image, pos, speed);
    boids.add(b);

    speed = new PVector(-0.3, -0.45);
    b = new Boid(3, boid_image, pos, speed);
    boids.add(b);

    speed = new PVector(0.5, 0.0);
    b = new Boid(4, boid_image, pos, speed);
    boids.add(b);
    */
    // fill boids
    for (int i = 0; i < 100; i++) {
        PVector speed = new PVector(i/100-0.1, i/100-0.1);
        Boid b = new Boid(i, boid_image, pos, speed);
        boids.add(b);
    }
    println('Initialized.');
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
    for (int i = 0; i < boids.size(); i++) {
        Boid b = boids.get(i);
        x = b.pos.x % w;
        y = b.pos.y % h;

        pushMatrix();
        translate(x, y);
        rotate(b.rot);
        image(b.img, -b.img_w/2, -b.img_h/2);
        popMatrix();

        if (b.id == 0) {
            noFill();
            ellipse(x, y, local_radius*2, local_radius*2);
            stroke(255, 0, 255);
            line(x, y, x+b.speed.x*20, y+b.speed.y*20);
            stroke(255, 0, 0);

            line(x, y, x+b.alignment.x*100, y+b.alignment.y*100);
            stroke(0, 255, 0);
            line(x, y, x+b.cohesion.x*100, y+b.cohesion.y*100);
            stroke(0, 0, 255);
            line(x, y, x+b.separation.x*100, y+b.separation.y*100);
            stroke(0, 0, 0);

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

class Boid {
    int id, x, y, img_w = 32, img_h = 32;
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
            if (pos.dist(b.pos) < local_radius && id != b.id)
                n.add(b);
        }
        return n;
    }

    /* Updating speed vector */
    void update() {
        n = neighbours();
        //if (id == 0) println('Boid ' + id + ' has ' + n.size() + ' neighbours.');

        /* ----- flocking algorithm ----- */
        PVector acceleration = new PVector(0, 0);

        // alignment: calculate mean speed vector of neighbours
        alignment = new PVector(0, 0);
        for (int i = 0; i < n.size(); i++) {
            alignment.add(n.get(i).speed); // add speed
        }
        if (n.size() > 0) alignment.div(n.size()); // mean speed vector
        if (alignment.mag() > max_force) {  // limit alignment force
            alignment.normalize();
            alignment.mult(max_force);
        }
        //println('alignment: ' + alignment);

        // separation
        separation = new PVector(0, 0);
        int count = 0;
        for (int i = 0; i < n.size(); i++) {
            PVector f = n.get(i).pos;
            float d = PVector.dist(pos, f);

            if (d > 0 && d < desired_separation) {
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
        //println('separation: ' + separation);

        // cohesion
        cohesion = new PVector(0, 0);
        for (int i = 0; i < n.size(); i++) {
            cohesion.add(n.get(i).pos);  // add positions
        }
        if (n.size() > 0) {
            cohesion.div(n.size()); // center of mass
            cohesion.sub(pos); // subtract own position to get vector to center
            if (cohesion.mag() > max_force) {  // limit alignment force
                cohesion.normalize();
                cohesion.mult(max_force);
            }
        }
        //println('cohesion: ' + cohesion);

        // TODO damping, max

        // adding it up
        alignment.mult(alignment_weight);
        acceleration.add(alignment);
        separation.mult(separation_weight);
        acceleration.add(separation);
        cohesion.mult(cohesion_weight);
        acceleration.add(cohesion);

        // update speed vector, limit by max_speed
        speed.add(acceleration);
        if (speed.mag() > max_speed) {
            speed.normalize();
            speed.mult(max_speed);
        }
    }

    /* Moving and resetting rotation*/
    void move() {
        pos.add(speed);

        // calculate angle
        rot = calculateAngle(v_normal, speed);
        //rot = PVector.angleBetween(v_normal, speed);
        //if (speed.y < 0) { rot = 2*PI - rot; }
    }

    void addSpeed(PVector v) {
        speed.add(v);
    }

    int getId() {
        return id;
    }
}
