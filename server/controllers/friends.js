const { Friends, Profile } = require('../../db/models');

module.exports = {
  getAll: (req, res) => {
    let status = ['Accepted', 'Pending', 'Waiting Approval']
    Friends.forge()
      .query((qb) => {
        qb.where('user_id', req.params.id).andWhere('status', 'in', status);
      })
      //.fetchAll({withRelated: ['user2']})
      .fetchAll()
      .then(friends => {
        // if (friends.toJSON())  {
        //   friends = friends.toJSON()
        //   friends = friends.map(friend => {
        //     console.log('friend',friend.user2)
        //     if (friend.user2.length > 0) {
        //       friend.first = friend.user2[0].first
        //       friend.image = friend.user2[0].image
        //       delete friend.user2
        //     }
        //     return friend
        //   })  
        // }
        console.log(friends.toJSON())
        res.status(200).send(friends.toJSON());
      })
      .catch(err => {
        console.log('err', err)
        res.status(503).send(err);
      });
  },

  create: (req, res) => {
    let outcome;
    Friends.forge({ user_id: req.params.id, friend_id: req.params.friendId, status:'Waiting Approval' })
      .save()
      .then(result => {
        outcome = result
        return Friends.forge({ user_id: req.params.friendId, friend_id: req.params.id, status:'Pending' })
        .save()
      })
      .then(result => {
        res.status(201).send(outcome);
      })
      .catch(err => {
        if (err.constraint === 'Existing friend') {
          return res.status(403);
        }
        res.status(500).send(err);
      });
  },

  update: (req, res) => {
    let outcome;
    let senderStatus
    if (req.params.status === 'Denied') {
      senderStatus = 'Blocked'
    } else if (req.params.status === 'Accepted'){
      senderStatus = 'Accepted'
    } 
    Friends.forge({ user_id: req.params.id, friend_id: req.params.friendId, status: req.params.status })
      .save()
      .then(result => {
        outcome = result
        return Friends.forge({ user_id: req.params.friendId, friend_id: req.params.id, status: senderStatus })
        .save()
      })
      .then(result => {
        res.status(201).send(outcome);
      })
      .catch(err => {
        if (err.constraint === 'Existing friend') {
          return res.status(403);
        }
        res.status(500).send(err);
      });
  },

  deleteOne: (req, res) => {
    Friends.forge()
      .query((qb) => {
        qb.where({ user_id: req.params.id, friend_id: req.params.friendId }).orWhere({ user_id: req.params.friendId, friend_id: req.params.id })
      })
      .fetchAll()
      .then(friends => {
        if (!friends) {
          throw friends;
        }
        return friends.map((friend) => {
          friend.destroy();
        })
      })
      .then(() => {
        res.sendStatus(200);
      })
      .error(err => {
        res.status(503).send(err);
      })
      .catch((err) => {
        console.log('Err in delete friends', err)
        res.sendStatus(404);
      });
  }
};