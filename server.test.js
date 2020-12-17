const chai = require('chai');
const chaiHttp = require('chai-http');
const { server, cleanCache, DEBOUNCE_TIME, DB_FILE } = require('./server');
const fs = require('fs')

chai.use(chaiHttp);
chai.should();

describe('12li.ga Server', () => {
  beforeEach((done) => {
    cleanCache()
    done()
  });

  it('GET /register/:name not registered route should 404', (done) => {
    chai.request(server)
      .get('/register/no-name')
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });

  it('GET /:name not registered route should 404', (done) => {
    chai.request(server)
      .get('/no-name')
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });

  it('POST /register/:name should register but not twice', (done) => {
    chai.request(server)
      .post('/register/coolname')
      .query({ link: 'http://example.com' })
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.be.eq('http://example.com');
      });

    chai.request(server)
      .post('/register/coolname')
      .query({ link: 'http://example.com' })
      .end((err, res) => {
        res.should.have.status(302);
      });

    chai.request(server)
      .get('/coolname')
      .end((err, res) => {
        res.should.redirectTo('http://example.com/');
        done();
      });
  });

  it('POST /register/:name should persist cache after debounce time', (done) => {
    chai.request(server)
      .post('/register/check-debounce')
      .set('x-forwarded-for', '99.10.0.1')
      .query({ link: 'http://example.com' })
      .end((err, res) => {
        res.should.have.status(200);
        const cacheContent = fs.readFileSync(DB_FILE, { encoding: 'utf8' })
        cacheContent.should.be.eq('{}') //not persisted immediately
      });

    setTimeout(() => {
      const cacheContent = fs.readFileSync(DB_FILE, { encoding: 'utf8' })
      cacheContent.should.be.eq('{"check-debounce":{"link":"http://example.com","userIp":"99.10.0.1","userAgent":"node-superagent/3.8.3"}}')
      done();
    }, DEBOUNCE_TIME + 100); //+ same_delay
  });


  describe('lowercase only', () => {
    beforeEach((done) => {
      chai.request(server)
        .post('/register/coolname')
        .query({ link: 'http://example.com' })
        .end((err, res) => {
          res.should.have.status(200);
          res.text.should.be.eq('http://example.com');
          done();
        });
    });

    it('GET /:name should redirect when querying uppercase', (done) => {
      chai.request(server)
        .get('/COOLNAME')
        .end((err, res) => {
          res.should.redirectTo('http://example.com/');
          done();
        });
    });

    it('GET /register/:name should ok when querying uppercase', (done) => {
      chai.request(server)
        .get('/register/COOLNAME')
        .end((err, res) => {
          res.should.have.status(302);
          done();
        });
    });

    it('GET /register/:name should not update when posting uppercase', (done) => {
      chai.request(server)
        .post('/register/COOLNAME')
        .query({ link: 'http://aloha.com' })
        .end((err, res) => {
          res.should.have.status(302);
        });

        chai.request(server)
          .get('/coolname')
          .end((err, res) => {
            res.should.redirectTo('http://example.com/');
            done();
          });
    });
  });

});
