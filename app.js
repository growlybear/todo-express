
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var tasks = require('./routes.tasks');
var http = require('http');
var path = require('path');

var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://localhost:27017/todo?auto_reconnect', {safe: true});

var app = express();

// export the database
app.use(function(req, res, next) {
    req.db = {};
    req.db.tasks = db.collection('tasks');
    next();
});

// access appname from every Jade template
app.locals.appname = 'Express.js Todo App';

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

app.use(express.cookieParser());
app.use(express.session({
    secret:'59B93087-78BC-4EB9-993A-A61FC844F6C9'   // ENV var for real apps
}));
app.use(express.csrf());

app.use(require('less-middleware')({
    src: __dirname + '/public',
    compress: true
}));

// router plugin MUST come after csrf() and less-middleware
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res, next) {
    res.locals._csrf = req.session._csrf;
    return next();
});

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.param('task_id', function (req, res, next, taskId) {
    req.db.tasks.findById(taskId, function (error, task) {
        if (error) return next(error);
        if (!task) return next(new Error('Task not found'));

        // we have data
        req.task = task;
        return next();
    });
});

// route definitions
app.get('/', routes.index);
app.get('/tasks', task.list);
app.post('/tasks', tasks.markAllCompleted);
app.post('/tasks', tasks.add);
app.post('/tasks/:task_id', tasks.markCompleted);
app.del('/tasks/:task_id', tasks.del);
app.get('/tasks/completed', tasks.completed);

// wildard handler for everything else
app.all('*', function (req, res) {
    res.send(404);
});

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
