async function run() {
  try {
    const url = "https://splendor-fakc0rqiu-tomotekashiki.vercel.app/api/bookings/available-slots?date=2026-06-12&vehicleTypeId=0e895ff0-aa64-4357-bc97-e54248afba1b&serviceIds=efa514e9-9567-4136-99a2-bc54d60e520b&branchId=708e3899-6367-4c71-9b46-c941cc90bfea";
    console.log("Fetching URL:", url);
    const res = await fetch(url);
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Text slice:", text.slice(0, 300));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
  process.exit(0);
}
run();
