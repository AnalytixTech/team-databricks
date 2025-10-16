import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { config } from './env';
import User from '../models/User';
import Reservation from '../models/Reservation';
import { UserRole, ReservationType } from '../types';

// JWT Strategy
const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.id);

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
      passReqToCallback: true, // Pass request to callback to access state
    },
    async (req: any, _accessToken, _refreshToken, profile: Profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if email already exists
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email provided by Google'), false);
          }

          user = await User.findOne({ email });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            await user.save();
          } else {
            // Get role from state parameter (passed from auth route)
            const roleFromState = req.query.state || 'regular_user';
            const userRole = roleFromState === 'business_owner' ? UserRole.BUSINESS_OWNER : UserRole.USER;

            console.log(`🔐 Creating new Google OAuth user with role: ${userRole}`);

            // Create new user with specified role
            user = await User.create({
              email,
              googleId: profile.id,
              role: userRole,
              profile: {
                savedPaymentMethods: [],
              },
            });

            // Convert any soft reservations to firm reservations for new Google users
            try {
              const softReservations = await Reservation.find({
                reservationType: ReservationType.SOFT_RESERVE,
                'guestInfo.email': email.toLowerCase(),
                status: { $in: ['pending', 'confirmed'] },
              });

              if (softReservations.length > 0) {
                console.log(`🔄 Converting ${softReservations.length} soft reservation(s) for Google user: ${email}`);
                
                for (const reservation of softReservations) {
                  reservation.userId = (user._id as any).toString();
                  reservation.reservationType = ReservationType.FIRM_RESERVE;
                  reservation.guestInfo = undefined;
                  reservation.softReserveExpiry = undefined;
                  await reservation.save();
                }
                
                console.log(`Converted ${softReservations.length} soft reservation(s) for Google OAuth user`);
              }
            } catch (conversionError) {
              console.error('Error converting soft reservations for Google user:', conversionError);
              // Don't fail auth if conversion fails
            }
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, false);
      }
    }
  )
);

export default passport;

