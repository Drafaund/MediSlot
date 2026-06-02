const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (user) return done(null, user);

    user = await User.findOne({ email: profile.emails[0].value });
    if (user) {
      user.googleId = profile.id;
      if (!user.avatar) user.avatar = profile.photos[0]?.value;
      await user.save();
      return done(null, user);
    }

    // Baca role dari state (dikirim saat inisiasi OAuth, hanya berlaku untuk user baru)
    const role = ['doctor', 'patient'].includes(req.query.state) ? req.query.state : 'patient';

    user = await User.create({
      name: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id,
      avatar: profile.photos[0]?.value,
      role
    });

    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));
