import { setRequestLocale } from 'next-intl/server';
import { getCurrentTrainee, fetchMyWorkouts, fetchMyMeals } from '@/actions/client-actions';
import { getMyProgressLogsByDate } from '@/actions/progress-actions';
import ClientChat from '@/components/client/ClientChat';
import ProgressToggleButton from '@/components/client/ProgressToggleButton';

type PageProps = { params: Promise<{ locale: string }> };

export default async function ClientDashboard({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Core Data Fetch using isolated secure backend actions
  const trainee = await getCurrentTrainee();

  if (!trainee) {
    return (
      <div className="text-center py-24 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-black text-text-main mb-3">اتصال غير مستقر</h2>
        <p className="text-text-muted font-bold text-lg">يرجى تسجيل الدخول مرة أخرى للوصول لبياناتك.</p>
      </div>
    );
  }

  // Safe Arrays
  const assignedWorkoutIds = trainee.traineeData?.assignedWorkouts || [];
  const assignedMealIds = trainee.traineeData?.assignedMeals || [];
  const coachUid = trainee.traineeData?.assignedCoachUid || '';

  const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });

  // Parallel Document Materializations
  const [workouts, meals, progressLogs] = await Promise.all([
    fetchMyWorkouts(assignedWorkoutIds),
    fetchMyMeals(assignedMealIds),
    getMyProgressLogsByDate(todayDate)
  ]);

  const firstName = trainee.name.split(' ')[0] || 'بطل';

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
       
       {/* ── Graphic Greeting Banner ── */}
       <div className="bg-qwaam-pink rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-qwaam-pink/20 relative overflow-hidden flex flex-col justify-center">
         <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-white/10 rounded-full pointer-events-none" />
         <div className="absolute top-[20%] right-[30%] w-48 h-48 bg-white/10 rounded-full pointer-events-none" />
         
         <div className="relative z-10 leading-relaxed md:w-2/3">
           <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">أهلاً بك يا {firstName}! ⚡</h1>
           <p className="text-lg sm:text-2xl font-bold opacity-90 leading-tight">
             هذه بوابتك الخاصة. تتبع برامجك، وخطتك الغذائية، وتواصل مع مدربك مباشرة.
           </p>
         </div>
       </div>

       {/* ── 2x1 Desktop Grid Structure ── */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
           
           {/* Center Content: Interactive Cards */}
           <div className="lg:col-span-2 space-y-12">
               
               {/* Workouts Module */}
               <section>
                 <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 bg-qwaam-pink-light rounded-2xl flex items-center justify-center text-xl shrink-0 border border-qwaam-pink/20 text-qwaam-pink font-black shadow-sm">
                     🏋️‍♂️
                   </div>
                   <h2 className="text-2xl font-black text-text-main">برامجك التدريبية المعينة</h2>
                 </div>

                 {workouts.length === 0 ? (
                   <div className="bg-white rounded-3xl p-8 border border-dashed border-border-light text-center flex flex-col items-center justify-center min-h-[220px]">
                      <span className="text-4xl opacity-50 grayscale mb-4">🕒</span>
                      <p className="font-bold text-text-muted text-sm max-w-[200px]">مدربك يقوم بتجهيز خطتك الرياضية الآن...</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {workouts.map(w => (
                         <div key={w.id} className="bg-white rounded-3xl p-6 border border-border-light shadow-sm hover:border-qwaam-pink hover:shadow-md hover:-translate-y-1 transition-all group">
                            <div className="flex justify-between items-start gap-4 mb-3">
                              <h3 className="font-extrabold text-lg text-text-main truncate group-hover:text-qwaam-pink transition-colors">{w.titleAr}</h3>
                              <span className="shrink-0 bg-qwaam-pink-light text-qwaam-pink px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">{w.difficulty}</span>
                            </div>
                            <p className="font-bold text-xs text-text-muted mb-6 truncate" dir="ltr" style={{textAlign:"right"}}>{w.titleEn}</p>
                            
                            <div className="flex items-center justify-between text-sm bg-gray-50 px-5 py-3.5 rounded-2xl border border-border-light/50 mb-4">
                               <div className="font-black text-text-main flex items-center gap-2"><span className="text-qwaam-pink text-lg text-shadow-sm">⏱</span> {w.duration} دقيقة</div>
                               <div className="font-extrabold text-text-muted px-3 py-1 bg-white rounded-lg border border-border-light">{w.exercises?.length || 0} حركات</div>
                            </div>
                            
                            <ProgressToggleButton 
                               itemId={w.id} 
                               type="workout" 
                               date={todayDate} 
                               initialState={progressLogs.some(log => log.itemId === w.id && log.type === 'workout')} 
                            />
                         </div>
                      ))}
                   </div>
                 )}
               </section>

               {/* Diet Module */}
               <section>
                 <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 bg-yellow-50 rounded-2xl flex items-center justify-center text-xl shrink-0 border border-yellow-200 text-yellow-600 font-black shadow-sm">
                     🥗
                   </div>
                   <h2 className="text-2xl font-black text-text-main">النظام الغذائي المخصص</h2>
                 </div>

                 {meals.length === 0 ? (
                   <div className="bg-white rounded-3xl p-8 border border-dashed border-border-light text-center flex flex-col items-center justify-center min-h-[220px]">
                      <span className="text-4xl opacity-50 grayscale mb-4">🕒</span>
                      <p className="font-bold text-text-muted text-sm max-w-[200px]">مدربك يقوم بصياغة نظام السعرات الخاص بك الآن...</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {meals.map(m => (
                         <div key={m.id} className="bg-white rounded-3xl border border-border-light shadow-sm flex flex-col overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
                            <div className="h-1.5 w-full bg-qwaam-yellow transition-all" />
                            <div className="p-6">
                              <h3 className="font-extrabold text-lg text-text-main truncate mb-1">{m.nameAr}</h3>
                              <p className="font-bold text-xs text-text-muted mb-5 truncate" dir="ltr" style={{textAlign:"right"}}>{m.nameEn}</p>
                              
                              <div className="flex justify-between items-center bg-gray-50 border border-border-light/50 rounded-2xl p-4 mb-5 shadow-inner">
                                <span className="font-bold text-xs text-text-muted uppercase tracking-widest">مجموع الطاقة</span>
                                <span className="font-black text-xl text-text-main bg-white px-3 py-1.5 rounded-xl border border-border-light shadow-sm">{m.calories} <span className="text-[10px] uppercase text-text-muted ml-0.5">Kcal</span></span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 mb-5">
                                 <div className="bg-red-50 text-red-700 py-2.5 rounded-xl text-center leading-tight">
                                    <span className="block text-[9px] uppercase font-black opacity-60 mb-1">PROTEIN</span>
                                    <span className="font-black text-sm">{m.macros.protein}g</span>
                                 </div>
                                 <div className="bg-green-50 text-green-700 py-2.5 rounded-xl text-center leading-tight">
                                    <span className="block text-[9px] uppercase font-black opacity-60 mb-1">CARBS</span>
                                    <span className="font-black text-sm">{m.macros.carbs}g</span>
                                 </div>
                                 <div className="bg-yellow-50 text-yellow-700 py-2.5 rounded-xl text-center leading-tight">
                                    <span className="block text-[9px] uppercase font-black opacity-60 mb-1">FATS</span>
                                    <span className="font-black text-sm">{m.macros.fats}g</span>
                                 </div>
                              </div>
                              
                              <ProgressToggleButton 
                                 itemId={m.id} 
                                 type="meal" 
                                 date={todayDate} 
                                 initialState={progressLogs.some(log => log.itemId === m.id && log.type === 'meal')} 
                              />
                            </div>
                         </div>
                      ))}
                   </div>
                 )}
               </section>

           </div>

           {/* Floating Live Chat Module */}
           <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-4">
                 <h2 className="text-xl font-black text-text-main flex items-center gap-3">
                   <span className="w-10 h-10 rounded-2xl bg-qwaam-pink-light flex items-center justify-center text-lg text-qwaam-pink border border-qwaam-pink/20 shadow-sm">
                    📱
                   </span>
                   الدعم المباشر
                 </h2>
                 <ClientChat coachUid={coachUid} traineeUid={trainee.uid} />
              </div>
           </div>

       </div>

    </div>
  );
}
