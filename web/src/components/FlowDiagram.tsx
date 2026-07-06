/**
 * תרשים זרימה: מצוקה → LoRa/Meshtastic+GPS או SMS → שרת → מתנדבים
 */
export default function FlowDiagram() {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white p-4 shadow" dir="rtl">
      <h3 className="mb-4 text-center text-lg font-bold text-red-800">תרשים זרימת קריאת מצוקה</h3>
      <div className="flex min-w-[640px] flex-col items-center gap-2 text-sm md:flex-row md:justify-center md:gap-4">
        <Box title="זיהוי אירוע" desc="אזרח / 101 / אפליקציה" color="bg-red-100" />
        <Arrow />
        <Box title="שידור מיקום" desc="LoRa+Meshtastic+GPS או SMS+נייד" color="bg-orange-100" />
        <Arrow />
        <Box title="שרת" desc="Geo-fencing + דירוג זמינות" color="bg-yellow-100" />
        <Arrow />
        <div className="flex flex-col gap-2">
          <Box title="Push / SMS" desc="ערוץ סלולרי" color="bg-green-100" />
          <Box title="LoRa Downlink" desc="צפצוף במכשיר" color="bg-blue-100" />
        </div>
        <Arrow />
        <Box title="מתנדב" desc="ניווט Waze + מסלול אופניים" color="bg-purple-100" />
      </div>
    </div>
  );
}

function Box({ title, desc, color }: { title: string; desc: string; color: string }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${color}`}>
      <div className="font-bold">{title}</div>
      <div className="text-xs text-gray-700">{desc}</div>
    </div>
  );
}

function Arrow() {
  return <div className="hidden text-2xl text-gray-400 md:block">←</div>;
}
