import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BASE_URL } from "../config/const.js";
import { findOrCreateSocialUser } from "../services/user.service.js";
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/api/auth/google/callback`,
      passReqToCallback: true, 
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
  const role = req.query.state;

        const user = await findOrCreateSocialUser({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          email:profile.emails[0].value,
          provider: profile.provider,
          providerId: profile.id,
          avatar: profile.photos[0].value,
          role: role || "ENTRANT" 
        });

        done(null, user);

      } catch (error) {
        done(error, null);
      }
    }
  )
);