import { fb } from "./firebase.js";
import { Branch, WashingBay } from "../models/types.js";

async function run() {
  console.log("Starting Firebase DB inspect & fix for washing bays...");
  try {
    // Wait a short moment to make sure Firebase DB has initialized
    await new Promise((r) => setTimeout(r, 2000));

    const branches = await fb.get("branches") || {};
    const bays = await fb.get("washing_bays") || {};

    const branchList = Object.values(branches) as Branch[];
    const bayList = Object.values(bays) as WashingBay[];

    console.log(`Found ${branchList.length} branches.`);
    console.log(`Found ${bayList.length} washing bays total.`);

    for (const branch of branchList) {
      console.log(`\n---------------------------------`);
      console.log(`Branch: "${branch.name}" (ID: ${branch.id})`);
      
      const branchBays = bayList.filter(b => b.branchId === branch.id);
      
      // Sort branch bays to determine the order they should be renamed in.
      // We'll sort by:
      // 1. Existing names that start with "Box" or "ბოქსი" numerically,
      // 2. Then by createdAt time.
      branchBays.sort((a, b) => {
        const aNumMatch = a.name.match(/\d+/);
        const bNumMatch = b.name.match(/\d+/);
        if (aNumMatch && bNumMatch) {
          const diff = parseInt(aNumMatch[0]) - parseInt(bNumMatch[0]);
          if (diff !== 0) return diff;
        } else if (aNumMatch) {
          return -1;
        } else if (bNumMatch) {
          return 1;
        }
        
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (aTime !== bTime) return aTime - bTime;
        
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });

      console.log("Current bays order:", branchBays.map(b => `${b.id.substring(0, 8)}... (${b.name})`));

      for (let i = 0; i < branchBays.length; i++) {
        const bay = branchBays[i];
        const newName = `ბოქსი ${i + 1}`;
        if (bay.name !== newName) {
          console.log(`Renaming bay ${bay.id} from "${bay.name}" to "${newName}"`);
          bay.name = newName;
          bay.updatedAt = new Date().toISOString();
          await fb.set(`washing_bays/${bay.id}`, bay);
        }
      }
    }
    console.log("\n---------------------------------");
    console.log("Database update completed successfully!");
  } catch (error) {
    console.error("Error during database update:", error);
  }
  process.exit(0);
}

run();
