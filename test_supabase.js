const SUPABASE_URL = "https://kbtnstuqemlojxlxjgyz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidG5zdHVxZW1sb2p4bHhqZ3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTQ0NDQsImV4cCI6MjA5NDU5MDQ0NH0.Y22HDAaSr64ZsQfGEFaJMoMI_ZmWVSwOuzHrXZpjpNM";

async function testSupabase() {
    console.log("Adding a test donor...");
    
    // 1. Insert Data
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/donor_registrations`, {
        method: "POST",
        headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        body: JSON.stringify({
            full_name: "John Doe (Test)",
            blood_group: "O+",
            phone: "+92 300 0000000",
            academic_batch: "Test Batch 2026"
        })
    });
    
    if (!insertRes.ok) {
        console.error("Insert failed:", await insertRes.text());
        return;
    }
    
    const insertedData = await insertRes.json();
    console.log("Successfully inserted test data:");
    console.log(insertedData);
    
    // 2. Read Data
    console.log("\nFetching recent donors (simulating Staff Portal)...");
    const selectRes = await fetch(`${SUPABASE_URL}/rest/v1/donor_registrations?select=*&order=created_at.desc&limit=3`, {
        method: "GET",
        headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
        }
    });
    
    if (!selectRes.ok) {
        console.error("Select failed:", await selectRes.text());
        return;
    }
    
    const data = await selectRes.json();
    console.log("Staff Portal fetched data:");
    data.forEach((donor, i) => {
        console.log(`${i+1}. ${donor.full_name} - ${donor.blood_group} - ${donor.academic_batch}`);
    });
}

testSupabase().catch(console.error);
