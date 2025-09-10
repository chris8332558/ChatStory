const Room = require('../models/postgres/room');

exports.addMember = async (req, res) => {
    const { room_id } = req.params;
    const { email } = req.body;
    const actor_id = req.user.id;

    console.log(`membershipController.js: addMember`);
    console.log(`room_id: ${room_id}, email: ${email}, actor_id: ${actor_id}`);
    try {
        const isAdmin = await Room.isAdmin({ user_id: actor_id, room_id });
        if (!isAdmin) {
            console.error('membershipControler.js: addMember failed: actor is not an admin');
            return res.status(403).json({ message: `membershipControoler.js: Add member failed. User ${actor_id} is not an admin.` });
        }

        let user_id_to_add;
        if (email) {
            const user_to_add = await Room.findUserByEmail({ email });
            if (!user_to_add) {
                return res.status(403).json( {message: `membershipControoler.js: Add member failed. User nor found by email`} );
            }
            user_id_to_add = user_to_add.user_id;
        }
        
        console.log(`user_id_to_add: ${user_id_to_add}`);
        await Room.addUserToRoom({ user_id: user_id_to_add, room_id });
        // Idempotent response: return 204 or 200 with a stable body. Preventing repeated submissions.
        return res.status(204).send();
        
    } catch (err) {
        console.error('membershipController: addMember error:', err);
        return res.status(500).json({ message: 'membershipController: addMember: Server error'});
    }
};

// TODO:
// exports.createInvite = async(req, res) => {}
// exports.redeemInvite = async(req, res) => {}