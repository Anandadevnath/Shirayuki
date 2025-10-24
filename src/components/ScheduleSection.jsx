import React, { useEffect, useState } from 'react';
import { FiClock } from 'react-icons/fi';
import { useShirayukiAPI } from '../context';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ScheduleSection() {
    const { getSchedule } = useShirayukiAPI();
    const [schedule, setSchedule] = useState([]);
    const [selectedDay, setSelectedDay] = useState(() => {
        const today = new Date();
        return dayNames[today.getDay()];
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        setLoading(true);
        getSchedule()
            .then((data) => {
                const arr = Array.isArray(data?.data) ? data.data : [];
                setSchedule(arr);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || 'Failed to fetch schedule');
                setLoading(false);
            });
    }, [getSchedule]);

    const scheduleByDay = {};
    schedule.forEach(item => {
        const day = item.day.replace(/\s*\(Today\)/, '');
        if (!scheduleByDay[day]) scheduleByDay[day] = [];
        scheduleByDay[day].push(item);
    });

    return (
        <section className="schedule-section max-w-[65vw]  bg-black rounded-xl p-6 shadow-xl border border-white/20">
            <div className="flex flex-wrap items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-white flex items-center gap-4"><FiClock className="inline-block" size={30}/> Estimated Schedule</h2>
                <span className="bg-white/90 text-black px-4 py-1 rounded-full font-mono text-sm">
                    (GMT{Intl.DateTimeFormat().resolvedOptions().timeZone}) {new Date().toLocaleTimeString()}
                </span>
            </div>
            <div className="flex gap-2 mb-8 overflow-x-auto">
                {dayNames.map((day, idx) => (
                    <button
                        key={day}
                        className={`px-8 py-4 rounded-2xl font-bold text-lg focus:outline-none transition-all ${selectedDay === day ? 'bg-white text-black shadow-lg' : 'bg-black text-white border border-white/20'}`}
                        onClick={() => setSelectedDay(day)}
                        style={{ minWidth: 120 }}
                    >
                        <div>{day.slice(0, 3)}</div>
                        <div className="text-xs font-normal mt-1 opacity-80">{(() => {
                            const d = new Date();
                            d.setDate(d.getDate() - (d.getDay() - idx));
                            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        })()}</div>
                    </button>
                ))}
            </div>
            {loading ? (
                <div className="text-white py-6">Loading schedule...</div>
            ) : error ? (
                <div className="text-red-400 py-6">{error}</div>
            ) : !scheduleByDay[selectedDay] || scheduleByDay[selectedDay].length === 0 ? (
                <div className="text-white py-6">No schedule available.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-white">
                        <tbody>
                            {scheduleByDay[selectedDay]
                                .sort((a, b) => a.time.localeCompare(b.time))
                                .map((item, idx) => (
                                    <tr key={idx} className="border-b border-white/20 hover:bg-white/10 transition">
                                        {/* left: show index number instead of time */}
                                        <td className="py-2 px-4 whitespace-nowrap text-gray-300 font-mono text-lg" style={{ width: '100px' }}>{idx + 1}</td>
                                        {/* main cell: anime title with time shown as a small label pinned to the right */}
                                        <td className="py-2 px-4 font-semibold text-lg relative pr-28">
                                            <span>{item.anime}</span>
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-normal">
                                                {item.time}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
