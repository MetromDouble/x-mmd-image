const viewImages = require('../actions/view.js');
const checkoutImage = require('../actions/checkout.js');
const createImage = require('../actions/create.js');
const updateImage = require('../actions/update.js');
const deleteImage = require('../actions/delete.js');
const remoteImage = require('../actions/remote.js');

module.exports = (app) => {
  app.get('/', viewImages);
  app.get('/:dir/:id/:name', checkoutImage);
  app.post('/upload/:dir', createImage);
  // app.put('/:dir/:id', updateImage);
  // app.delete('/:dir/:id', deleteImage);
  app.post('/download/:dir', remoteImage);
  app.get('/download/:dir', remoteImage);
};
