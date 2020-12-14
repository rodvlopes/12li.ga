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

  it('/GET not registered route should 404', (done) => {
    chai.request(server)
      .get('/no-name')
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });

  it('/POST a single link by its name (not twice)', (done) => {
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

  it('/POST should persist cache after debounce time', (done) => {
    chai.request(server)
      .post('/register/check-debounce')
      .query({ link: 'http://example.com' })
      .end((err, res) => {
        res.should.have.status(200);
        const cacheContent = fs.readFileSync(DB_FILE, { encoding: 'utf8' })
        cacheContent.should.be.eq('{}') //not persisted immediately
      });

    setTimeout(() => {
      const cacheContent = fs.readFileSync(DB_FILE, { encoding: 'utf8' })
      cacheContent.should.be.eq('{"check-debounce":"http://example.com"}')
      done();
    }, DEBOUNCE_TIME + 100); //+ same_delay
  });

});