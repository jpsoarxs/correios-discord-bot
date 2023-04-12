import cron from "node-cron";

import CodeModel from "../database/models/codes";

export default cron.schedule("0 0 */5 * *", async () => {
  console.log("running job notify every 5 days");

  try {
    const codes = await CodeModel.find({ active: false });

    if (!codes) return;

    let count = 0;
    for (const code of codes) {
      const date = new Date(code.createdAt);
      const now = new Date();

      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 5) {
        await CodeModel.deleteOne({ _id: code._id });
        count++;
      }
    }

    console.log(`deleted ${count} codes`);
    console.log("job notify finished");
  } catch (error) {
    console.log(error);
  }
});
