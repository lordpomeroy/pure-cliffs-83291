# Master your champion

## About

There is a working site of this application at [Heroku](https://pure-cliffs-83291.herokuapp.com). Befor you dive into the code you should check it out.

Feel free to leave feedback or request for additional features.

This application uses the Riot Games API to collect an analyze data concerning champion masteries. It was created as part of the [Riot Games API Challenge 2016](https://developer.riotgames.com/discussion/announcements/show/eoq3tZd1) The site is divided in two major parts.

### Home

Researching a single summoner with all its summoner masteries. This feature is available for every region. The data can then be sorted by champion points, missing points to the next level or the current standing in the region if available.

### Regions

This site uses Game data of 2 servers to create an overview over the players in this regions. The collected data is used to show comparison values in the Home tab aswell. The servers used are: Europe West (EUW) and North America (NA).

Currently a total of approximately 4,000 summoners are on file. This includes:
    * Most popular Champions by accumulated champion points
    * Player ranking on a single champion
    * Average and total champion points on a champion

## Development

The application is build on top of the [MEAN-Stack](http://mean.io/#!/) using a MongoDB, ExpressJS and NodeJS for the server and AngularJS for the frontend. Additionally some plugins for node and angular where used. You can find a full list in the package.json for node modules and bower.json for angular plugins. For frontend look and feel the popular [Bootstrap-Framework](http://getbootstrap.com/) was used in combination with [UI Boostratp](https://angular-ui.github.io/bootstrap/) a framework to integrate AngularJS and Bootstrap.

### Getting started

To start the application after downloading or forking it you need to have a working installation of [NodeJS](https://nodejs.org/en/) including npm, the node package manager.

The following commands are needed if you just installed node and npm:  
```
npm install -g bower
```
This installs bower globally. As bower is used in many different apllications as package manager this is recommanded. The dependency is included in the package.json anyway.  
```
npm install
```
This installs all dependencies for node as listed in the package.json.  
```
bower install
```
This installs all dependencies for angular as listed in the bower.json.


Then you have to add a key.js file under app/config. This file has to have the following structure:
```javascript
module.exports = {
    apiKey: 'Your API key', 
    mongoDB:  'Your MongoDB connection String'
};
```
As the contained data is a potential security risk it is not contained in this repository and shouldn't be contained in your fork either!

Then you can start the application from the main directory with:
```
node server.js
```
For easier development the application uses the TaskRunner [Grunt](http://gruntjs.com/). If you have installed it you can start the application by simply using
```
grunt
```
in the main directory. This call performs a semantic and documentation/comment check. Additionally the minimized css and javscript files are build. Afterwards the node server is started and the files are monitored for changes. The build is automatically repeated on every filechange.

### Application Structure

The application is generally divided as follows (not all files are listed):
```
app              - The full server implementation
  config         - The Configuration files
  server         - The server side implementation
    controllers  - The logic of the server
    models       - The Schematics (kind of Objects) for MongoDB
    routes       - The API routes provided by the server
  routes.js      - Automatic assembly of all routes
  showRouting.js - File to show all routes on server startup
downloads        - File for stored champion data json
node_modules     - Folder for the node modules (not in git)
public           - The frontend implementation
  dist           - Distribtion directory with minimized files for deployment to a production environment
  images         - Directory for all used images
  libs           - Folder for the angular plugins (not in git)
  system         - Main frontend implementation folder
    controller   - Angular Controller for the pages
    css          - Stylesheets
    services     - Angular Services
    views        - HTML pages
    app.js       - Main Angular file
    appRoutes.js - Frontend navigation
Gruntfile.js     - Grunt task runner configuration
server.js        - Server base file
```