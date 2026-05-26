// import { Strategy as FacebookStrategy } from "passport-facebook";
// import { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } from "../config/const.js";


// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: FACEBOOK_APP_ID,
//       clientSecret: FACEBOOK_APP_SECRET,
//       callbackURL: "/auth/facebook/callback",
//       profileFields: ["id", "emails", "name"],
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         const email = profile.emails?.[0]?.value;

//         let user = await User.findOne({ email });

//         if (!user) {
//           user = await User.create({
//             name: `${profile.name.givenName} ${profile.name.familyName}`,
//             email,
//             provider: "facebook",
//             providerId: profile.id,
//             isVerified: true,
//           });
//         }

//         return done(null, user);
//       } catch (err) {
//         return done(err, null);
//       }
//     }
//   )
// );