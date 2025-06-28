const express = require("express");
const userRoute = require("./user.route");
const adminRoute = require("./admin.route");
const roleRoute = require("./role.route");
const permissionRoute = require("./permission.route");
const directImportRoute = require("./directImport.route");
const marketRoute = require("./market.route");
const compaignRoute = require("./compaign.route");
const followCompaignRoute = require("./followCompaign.route");
const initialAndFollowTemplateRoute = require("./initialAndFollowTemplate.route");
const quickReplyTemplateRoute = require("./quickReplyTemplate.route");
const inboxRoute = require("./inbox.route");
const batchRoute = require("./batch.route");
const tagRoute = require("./tag.route");
const statusRoute = require("./status.route");
const dashboardRoute = require("./dashboard.route");
const mainBatchesRoute = require("./mainBatches.route");
const batchCronRoute = require("./batchCron.route");
const dripAutomationRoute = require("./dripAutomation.route");
const dncRoute = require("./dnc.route");
const areaCodeRoute = require("./areaCode.route");
const router = express.Router();

const defaultRoutes = [
  {
    path: "/v1/api/user",
    route: userRoute,
  },
  {
    path: "/v1/api/admin",
    route: adminRoute,
  },
  {
    path: "/v1/api/role",
    route: roleRoute,
  },
  {
    path: "/v1/api/permission",
    route: permissionRoute,
  },
  {
    path: "/v1/api/directImport",
    route: directImportRoute,
  },
  {
    path: "/v1/api/market",
    route: marketRoute,
  },
  {
    path: "/v1/api/compaign",
    route: compaignRoute,
  },
  {
    path: "/v1/api/followCompaign",
    route: followCompaignRoute,
  },
  {
    path: "/v1/api/initialAndFollowTemplate",
    route: initialAndFollowTemplateRoute,
  },
  {
    path: "/v1/api/quickReplyTemplate",
    route: quickReplyTemplateRoute,
  },
  {
    path: "/v1/api/batch",
    route: batchRoute,
  },
  {
    path: "/v1/api/tag",
    route: tagRoute,
  },
  {
    path: "/v1/api/status",
    route: statusRoute,
  },
  {
    path: "/v1/api/dashboard",
    route: dashboardRoute,
  },
  {
    path: "/v1/api/inbox",
    route: inboxRoute,
  },
  {
    path: "/v1/api/mainBatches",
    route: mainBatchesRoute,
  },
  {
    path: "/v1/api/batchCron",
    route: batchCronRoute,
  },
  {
    path: "/v1/api/dripAutomation",
    route: dripAutomationRoute,
  },
  {
    path: "/v1/api/dnc",
    route: dncRoute,
  },
  {
    path: "/v1/api/areaCode",
    route: areaCodeRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
