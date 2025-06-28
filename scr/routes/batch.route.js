const express = require("express");
const {
  requireSignin,
  requireCronAuthentication,
} = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { batchValidation } = require("../validations");
const { batchController } = require("../controllers");
const router = express.Router();

router
  .route("/:batchId")
  .get(
    requireSignin,
    validate(batchValidation.getBatchById),
    batchController.getBatchById
  )
  .patch(
    requireSignin,
    validate(batchValidation.updateBatchById),
    batchController.updateBatchById
  )
  .delete(
    requireSignin,
    validate(batchValidation.deleteBatchById),
    batchController.deleteBatchById
  );

router
  .route("/send/message/from/inbox")
  .post(
    requireSignin,
    validate(batchValidation.sendMessage),
    batchController.sendMessageFromInbox
  );
router
  .route("/send/message/from/inbox/phone2")
  .post(
    requireSignin,
    validate(batchValidation.sendMessage),
    batchController.sendMessageFromInboxOfPhone2
  );

router
  .route("/send/message/from/inbox/phone3")
  .post(
    requireSignin,
    validate(batchValidation.sendMessage),
    batchController.sendMessageFromInboxOfPhone3
  );
router.route("/get/campagin").get(requireSignin, batchController.getCampagin);
router.route("/inbound/callback").post((req, res) => {
  batchController.getInbound(
    req,
    res,
    global.io,
    global.userSocketMap,
    global.redisPublisher
  );
});

router.route("/socket/test").get((req, res) => {
  batchController.socketTest(req, res, global.io);
});
router.route("/smsStatus/callback").post(batchController.smsStatus);
router
  .route("/get/inbox/detail/:phone/:inboxId")
  .get(requireSignin, batchController.getInboxDetail);
router
  .route("/get/for/campaign/:batchId")
  .get(requireSignin, batchController.getBatchForSingleCampaign);
router
  .route("/add/tag/:inboxId")
  .post(
    requireSignin,
    validate(batchValidation.addTagToInbox),
    batchController.addTagToInbox
  );
router
  .route("/remove/tag/:inboxId")
  .post(
    requireSignin,
    validate(batchValidation.addTagToInbox),
    batchController.removeTagToInbox
  );
router
  .route("/add/note/:inboxId")
  .post(
    requireSignin,
    validate(batchValidation.addNoteToInbox),
    batchController.addNoteToInbox
  );

router
  .route("/get/note/:inboxId")
  .get(
    requireSignin,
    validate(batchValidation.getNoteOfInbox),
    batchController.getNoteOfInbox
  );

router.route("/get/crone/batch").get(batchController.getCroneBatch);
router
  .route("/delete/note/:inboxId")
  .patch(
    requireSignin,
    validate(batchValidation.deleteNoteOfInbox),
    batchController.deleteNoteOfInbox
  );
router
  .route("/get/list/of/activity/:inboxId")
  .get(requireSignin, batchController.getListOfActivity);
router
  .route("/add/to/verified/number/:inboxId")
  .post(
    requireSignin,
    validate(batchValidation.changeStatusOfNumber),
    batchController.addToVerfiedNumber
  );
router
  .route("/mark/as/read/:inboxId")
  .get(
    requireSignin,
    validate(batchValidation.markAsRead),
    batchController.markAsRead
  );
router
  .route("/remove/to/verified/number/:inboxId")
  .post(
    requireSignin,
    validate(batchValidation.changeStatusOfNumber),
    batchController.removeToVerfiedNumber
  );
router
  .route("/add/to/wrong/number/:inboxId")
  .post(
    requireSignin,
    validate(batchValidation.changeStatusOfNumber),
    batchController.addToWrongNumber
  );
router
  .route("/remove/to/wrong/number/:inboxId")
  .post(
    requireSignin,
    validate(batchValidation.changeStatusOfNumber),
    batchController.removeToWrongNumber
  );
router
  .route("/add/to/dnc/number/:inboxId")
  .post(
    requireSignin,
    validate(batchValidation.changeStatusOfNumber),
    batchController.addToDNCNumber
  );
router
  .route("/remove/to/dnc/number/:inboxId")
  .post(
    requireSignin,
    validate(batchValidation.changeStatusOfNumber),
    batchController.removeToDNCNumber
  );
router
  .route("/set/reminder/:inboxId")
  .post(
    requireSignin,
    validate(batchValidation.setReminder),
    batchController.setReminder
  );
router
  .route("/get/reminder/:reminderId")
  .get(
    requireSignin,
    validate(batchValidation.getReminder),
    batchController.getReminder
  );

router
  .route("/delete/reminder/:reminderId")
  .delete(
    requireSignin,
    validate(batchValidation.getReminder),
    batchController.deleteReminder
  );
// .delete(requireSignin, validate(batchValidation.getReminder), (req, res) => {
//   batchController.deleteReminder(req, res, global.io);
// });
router
  .route("/update/reminder/:reminderId")
  .patch(
    requireSignin,
    validate(batchValidation.updateReminder),
    batchController.updateReminder
  );
router
  .route("/get/all/reminder")
  .get(requireSignin, batchController.getAllReminder);
router
  .route("/mark/as/un/read/:inboxId")
  .get(
    requireSignin,
    validate(batchValidation.markAsRead),
    batchController.markAsUnRead
  );

router
  .route("/add/status/:inboxId")
  .post(
    requireSignin,
    validate(batchValidation.addStatusInInboxs),
    batchController.addStatusInInbox
  );
router
  .route("/delete/status/:inboxId")
  .patch(
    requireSignin,
    validate(batchValidation.deleteStatusInInboxs),
    batchController.deleteStatusInInbox
  );

router
  .route("/change/template/:batchId")
  .patch(
    requireSignin,
    validate(batchValidation.changeTemplate),
    batchController.changeTemplate
  );
router
  .route("/get/user/for/inbox/search")
  .get(batchController.getUserForInboxSearch);
router.route("/push/data/into/crm").post(
  requireSignin,
  // validate(batchValidation.pushDataIntoCrm),
  batchController.pushDataIntoCrm
);
router
  .route("/callBack/push/data/into/crm")
  .get(batchController.callBackpushDataIntoCrm);
router
  .route("/change/lead/name/:inboxId")
  .patch(
    requireSignin,
    validate(batchValidation.changeProspectName),
    batchController.changeProspectName
  );
router
  .route("/send/auto/reminder")
  .get(requireCronAuthentication, (req, res) => {
    batchController.sendAutoReminder(req, res, global.io);
  });
router
  .route("/reset/auto/template")
  .get(requireCronAuthentication, batchController.resetAutoTemplate);

module.exports = router;
