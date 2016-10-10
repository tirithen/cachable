const fs = require('fs');
const mkdirp = require('mkdirp');
const zlib = require('zlib');
const rmdir = require('rmdir');
const hash = require('object-hash');

function hashObject(object) {
  return hash(object, { algorithm: 'md5', encoding: 'base64' });
}

class PromisedCache {
  constructor(directory, defaultTimeToRelease = 60 * 1000) {
    mkdirp.sync(directory);
    this.directory = directory;
    this.defaultTimeToRelease = defaultTimeToRelease;
    this.inMemory = new Map();
  }

  get(key) {
    function hasExpired(postData) {
      return postData.expires < Date.now();
    }

    if (key instanceof Object) {
      key = hashObject(key);
    }

    let post = this.inMemory.get(key);
    return new Promise((resolve) => {
      if (post) {
        if (hasExpired(post)) {
          this.delete(key).then(resolve, resolve);
        } else {
          resolve(post.value);
        }
      } else {
        post = '';
        const filename = this.getFilenameForKey(key);
        const readStream = fs.createReadStream(filename);
        const decompress = zlib.createGunzip();

        decompress.on('error', () => {
          resolve();
        });
        decompress.on('data', (chunk) => {
          post += chunk.toString();
        });
        decompress.on('end', () => {
          post = JSON.parse(post);
          if (hasExpired(post)) {
            this.delete(key).then(resolve, resolve);
          } else {
            resolve(post.value);
          }
        });
        readStream.on('error', () => {
          resolve();
        });
        readStream.pipe(decompress);
      }
    });
  }

  set(key, value, timeToRelease = this.defaultTimeToRelease) {
    if (key instanceof Object) {
      key = hashObject(key);
    }

    const post = {
      expires: Date.now() + timeToRelease,
      value
    };

    this.inMemory.set(key, post);

    return new Promise((resolve, reject) => {
      const filename = this.getFilenameForKey(key);
      const writeStream = fs.createWriteStream(filename);
      const compress = zlib.createGzip();
      const data = JSON.stringify(post);

      compress.on('error', reject);
      compress.on('finish', resolve);
      compress.pipe(writeStream);
      compress.write(data);
      compress.end();
    });
  }

  delete(key) {
    if (key instanceof Object) {
      key = hashObject(key);
    }

    return new Promise((resolve) => {
      this.inMemory.delete(key);
      fs.unlink(this.getFilenameForKey(key), () => {
        resolve();
      });
    });
  }

  clear() {
    return new Promise((resolve, reject) => {
      this.inMemory.clear();
      rmdir(this.directory, (error) => {
        if (error) {
          reject(error);
        } else {
          mkdirp.sync(this.directory);
          resolve();
        }
      });
    });
  }

  getFilenameForKey(key) {
    if (key instanceof Object) {
      key = hashObject(key);
    }

    return `${this.directory}/${key}.json.gz`;
  }
}

module.exports = PromisedCache;
