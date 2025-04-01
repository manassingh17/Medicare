const User = require('../models/UserSchema');
const Booking = require('../models/BookingSchema');
const Doctor = require('../models/DoctorSchema');
const express = require('express');
const passport = require('passport');
const Stripe = require('stripe');


const router = express.Router();

const getCheckoutSession = async (req, res) => {
    // console.log(req);
    const doctor = await Doctor.findById(req.params.doctorId);
    const user = await User.findById(req.user._id);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    try {
        // Create Stripe checkout session with customer email, name, and address
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            success_url: `${process.env.CLIENT_SITE_URL}/checkout-success`,
            cancel_url: `${req.protocol}://${req.get('host')}/doctor/${doctor._id}`,
            customer_email: req.user.email,
            client_reference_id: req.params.doctorId,
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        unit_amount: doctor.ticketPrice * 100,
                        product_data: {
                            name: doctor.name,
                            description: doctor.bio,
                            images: [doctor.photo]
                        },
                    },
                    quantity: 1
                }
            ],
        });

        const booking = new Booking({
            doctor: doctor._id,
            user: user._id,
            ticketPrice: doctor.ticketPrice,
            session: session.id
        });

        const savedBooking = await booking.save();

        await Doctor.findByIdAndUpdate(doctor._id, {
            $push: { appointments: savedBooking._id}
        });


        await User.findByIdAndUpdate(user._id, {
            $push: { appointments: savedBooking._id}
        });

        res.status(200).json({ success: true, message: 'Successfully paid', session });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error creating checkout session!' });
    }
};

router.post('/checkout-session/:doctorId', passport.authenticate('jwt', { session: false }), getCheckoutSession);

module.exports = router;