/*
    Rewrote my Python script from 2012 to show it on the web.
    Author: Adrianus Kleemans, a.kleemans@gmail.com
    Date: Nov 2015
    
    Original post: http://harry.me/blog/2011/02/17/neat-algorithms-flocking/
    ProcessingJS reference: http://processingjs.org/reference/

*/

boids = new ArrayList();
int w = 600, h = 400;
float speedOfRotation;

void setup() {
    //smooth ?
    size(w, h);
    frameRate(30);
    PImage boid_image = loadImage("bird.png");
    
    PVector pos = new PVector(w/2, h/2);
    
    PVector speed = new PVector(0.2, 0.2);
    Boid b = new Boid(0, boid_image, pos, speed);
    boids.add(b);
    
    speed = new PVector(0.2, -0.1);
    b = new Boid(1, boid_image, pos, speed);
    boids.add(b);
    
    speed = new PVector(-0.15, 0.2);
    b = new Boid(2, boid_image, pos, speed);
    boids.add(b);
    
    speed = new PVector(-0.1, -0.1);
    b = new Boid(3, boid_image, pos, speed);
    boids.add(b);
    
    speed = new PVector(0.3, 0.0);
    b = new Boid(4, boid_image, pos, speed);
    boids.add(b);
    
    // fill boids
    //for (int i = 0; i < 10; i++) {
    //    PVector speed = new PVector(0.2, i/50-0.1);
    //    Boid b = new Boid(i, boid_image, pos, speed);
    //    boids.add(b);
    //}
    println('Initialized.');
    
    PVector v_normal = new PVector(1, 0);
    PVector speed = new PVector(0, -1);
    rot = PVector.angleBetween(speed, v_normal);
    println('Rotation 1: ' + rot);
    

    speed = new PVector(0, 1);
    rot = PVector.angleBetween(speed, v_normal);
    println('Rotation 2: ' + rot);
    
}

// main loop
void draw() {
    // TODO calculate new speed vectors

    // move boids
    for (int i = 0; i < boids.size(); i++) {
        boids.get(i).move();
    }
    
    // draw
    background(255);
    for (int i = 0; i < boids.size(); i++) {
        Boid b = boids.get(i);
        
        pushMatrix();
        translate(b.pos.x, b.pos.y);
        rotate(b.rot);
        image(b.img, -b.img_w/2, -b.img_h/2);
        popMatrix();
    }
}

class Boid {
    int id, x, y, img_w = 32, img_h = 32;
    float rot;
    PImage img;
    PVector pos;
    PVector speed;

    Boid(int _id, PImage _img, PVector _pos, PVector _speed) {
        rot = 0;
        id = _id;
        img = _img;
        pos = new PVector(_pos.x, _pos.y);
        speed = new PVector(_speed.x, _speed.y);
        size.x
    }
    
    /* Moving and resetting rotation*/
    void move() {
        pos.add(speed);
        
        // calculate angle
        PVector v_normal = new PVector(1, 0);
        rot = PVector.angleBetween(v_normal, speed);
        if (speed.y < 0) { rot = 2*PI - rot; }
    }
    
    void addSpeed(PVector v) {
        speed.add(v);
    }
    
    int getId() {
        return id;
    }
}