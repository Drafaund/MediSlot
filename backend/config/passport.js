const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Cek apakah user sudah ada
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      return done(null, user);
    }

    // Cek apakah email sudah terdaftar (user daftar manual sebelumnya)
    user = await User.findOne({ email: profile.emails[0].value });

    if (user) {
      // Hubungkan akun Google ke akun yang sudah ada
      user.googleId = profile.id;
      if (!user.avatar) user.avatar = profile.photos[0]?.value;
      await user.save();
      return done(null, user);
    }

    // Buat user baru dari Google profile
    user = await User.create({
      name: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id,
      avatar: profile.photos[0]?.value,
      role: 'patient'
    });

    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));
