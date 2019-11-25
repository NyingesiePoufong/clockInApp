const moment = require('moment')

module.exports = function(app, passport, db) {

  // normal routes ===============================================================

  app.get('/', (req, res) => {
    //console.log(db)
    db.collection('clockLogs').find().toArray((err, result) => {
      if (err) return console.log(err)
      res.render('index.ejs', {clockLogs: result})
    })
  });
/*
  function adminTransform(clockLogResults) {
    let adminTransformedResults = [];
    // what should this look like?
    return adminTransformedResults;
  }
*/
  app.post('/add-timelog', (req, res) => {
    const {timeIn, timeOut, employee} = req.body
    const momentTimeIn = moment(parseInt(timeOut));
    const momentTimeOut = moment(parseInt(timeIn));
    req.body.totalHours =  momentTimeIn.diff(momentTimeOut, 'hours');
    req.body.date = moment().format('MM/DD/YYYY');
    db.collection('adminTimeLogs').save(req.body, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect("/timesheet");
    });
  });

  // PROFILE SECTION =========================
  app.get('/timesheet', isLoggedIn, function(req, res) {
    console.log('got here tssss')
    if (req.user.local.isAdmin === true) {
      db.collection('adminTimeLogs').find().toArray((err, results) => {
        res.render('adminTimeLogs.ejs', {results});
      });
    } else {
      const {email} = req.user.local;
      const today = moment().format('MM/DD/YYYY');
      db.collection('adminTimeLogs').find({employee: email, date: today}).toArray((err, results) => {
        db.collection('clockLogs').find({
          email,
          date: today
        }).toArray((err, result) => {
          if (err) return console.log(err)
          res.render('timesheet.ejs', {
            user : req.user,
            punchIn: result.find(r => r.type === 'punched-in'),
            punchOut: result.find(r => r.type === 'punched-out'),
            timeLogSubmitted: results.length
          })
        });
      });
    }
  });

  // LOGOUT ==============================
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  // message board routes ===============================================================
  app.post('/punched-in', isLoggedIn, (req, res) => {
    const {latitude, longitude, timelog} = req.body //object destructuring
    const {email} = req.user.local //this is the same as email = req.user.local.email
    let correctInputlat= 42
    let correctInputlon= -71
    console.log("punched-in", email)
    //console.log('req bodyyyy', req.user)
    // if(checkLocation(req.body.latitude, req.body.longitude) === false)
    if(parseInt(latitude) === correctInputlat && parseInt(longitude) === correctInputlon){
      console.log("before save")
      db.collection('clockLogs').save(
        {
          email,
          timestamp: timelog,
          latitude, longitude,
          type:"punched-in",
          date: moment().format('MM/DD/YYYY')
        }, (err, result) => {
          console.log("after save")
          if (err) return console.log(err)
          console.log('saved to database')
          res.redirect("/timesheet");
        });
      }else {
        res.redirect("/login")
        // if (err) return console.log(err)
        console.log('redirected to login')
      }
    })

    app.post('/punched-out', isLoggedIn, (req, res) => {
      const {latitude, longitude, timelog} = req.body
      const {email} = req.user.local
      let correctInputlat= 42
      let correctInputlon= -71
      //console.log('req bodyyyy', req.user)
      // if(checkLocation(req.body.latitude, req.body.longitude) === false)
      if(parseInt(latitude) === correctInputlat && parseInt(longitude) === correctInputlon){
        db.collection('clockLogs').save({email, timestamp: timelog, latitude, longitude, type:"punched-out", date: moment().format('MM/DD/YYYY')}, (err, result) => {
          console.log("YOU Passed", err, 'resssssssss', result)

          res.redirect("/timesheet")
          console.log('saved to database')
          if (err) return console.log(err)

        })
      }else {
        res.redirect("/login")
        // if (err) return console.log(err)
        console.log('redirected to login')
      }
    })

    app.get('/delete-timelog/:id', (req, res) => {
      console.log('req paramss', req.params)
      const recordId = new require('mongodb').ObjectID(req.params.id);
      db.collection('adminTimeLogs').findOne({_id: recordId}, (err, result) => {
        if (err) {
          res.status(500).send(err);
        } else {
          db.collection('adminTimeLogs').findOneAndDelete({_id: recordId},(error, resultz) => {
            if (error) {
              res.status(500).send(error);
            }else{
              console.log('deleted!!!!', recordId)
              db.collection('clockLogs').deleteMany({email: result.employee, date: result.date}, (errorz, resultsz) => {
                if (errorz) {
                  res.status(500).send(errorz);
                }else{
                  console.log('clockLogsDeleted!!!!!!', recordId, result.date);
                  res.redirect('/timesheet')
                }
              })
            }
          })
        }
/*
        if(result === {id: req.body.id}){
          db.collection('adminTimeLogs').findOneAndDelete({id:req.body.id}),
        }else if(result === {req.body.email}){
          db.collection('clockLogs').deleteMany({email: req.body.email, {date}}),
        }else{
          res.send('message deleted!')
        }
        */
      });
      // find the adminTimeLog associated with the ID,
      // delete the adminTimeLog,
      // delete clockLogs with the user email and today's date
    });

    // AUTHENTICATE (FIRST LOGIN) ==================================================
    // =============================================================================

    // locally --------------------------------
    // LOGIN ===============================
    // show the login form
    app.get('/login', function(req, res) {
      res.render('login.ejs', { clockLogs: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
      successRedirect : '/timesheet', // redirect to the secure profile section
      failureRedirect : '/login', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
    }));

    // SIGNUP =================================
    // show the signup form
    app.get('/signup', function(req, res) {
      res.render('signup.ejs', { clockLogs: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
      successRedirect : '/timesheet', // redirect to the secure profile section
      failureRedirect : '/signup', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
    }));

    // =============================================================================
    // UNLINK ACCOUNTS =============================================================
    // =============================================================================
    // used to unlink accounts. for social accounts, just remove the token
    // for local account, remove email and password
    // user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
      var user            = req.user;
      user.local.email    = undefined;
      user.local.password = undefined;
      user.save(function(err) {
        res.redirect('/timesheet');
      });
    });

  };

  // route middleware to ensure user is logged in
  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
    return next();
    res.redirect('/');
  }
