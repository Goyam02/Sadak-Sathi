import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Dimensions, FlatList,
} from 'react-native';
import { useHazardStore } from '../../store/useHazardStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useNearbyHazards } from '../../hooks/useNearbyHazards';
import { severityColor } from '../../utils/impactClassifier';
import { Hazard } from '../../api/hazards';
import DemoModeBanner from '../../components/DemoModeBanner';
import PotholeImage from '../../components/PotholeImage';
import {
  useDemoStore, DEMO_HAZARDS, DEMO_LOCATION,
  DEMO_CONTRACTORS, DEMO_ROUTE_INFO,
} from '../../store/useDemoStore';

const { width: W } = Dimensions.get('window');
const MAP_H = 260;
const MAP_W = W - 32;

const MAP_BOUNDS = { latMin: 28.627, latMax: 28.641, lonMin: 77.214, lonMax: 77.228 };

function toXY(lat: number, lon: number) {
  const x = ((lon - MAP_BOUNDS.lonMin) / (MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin)) * MAP_W;
  const y = MAP_H - ((lat - MAP_BOUNDS.latMin) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * MAP_H;
  return { x, y };
}

const ROADS: [number, number][][] = [
  [[28.6295, 77.214], [28.6295, 77.228]],
  [[28.6325, 77.214], [28.6325, 77.228]],
  [[28.6355, 77.214], [28.6355, 77.228]],
  [[28.627, 77.2175], [28.641, 77.2175]],
  [[28.627, 77.2198], [28.641, 77.2198]],
  [[28.627, 77.2225], [28.641, 77.2225]],
  [[28.628, 77.214], [28.628, 77.228]],
  [[28.637, 77.214], [28.637, 77.228]],
  [[28.627, 77.216], [28.641, 77.216]],
  [[28.627, 77.221], [28.641, 77.221]],
];

const ROUTE_A: [number, number][] = [
  [28.6325, 77.2198], [28.6321, 77.2198], [28.6315, 77.2210],
  [28.6308, 77.2187], [28.6295, 77.2175], [28.6287, 77.2170],
];
const ROUTE_B: [number, number][] = [
  [28.6325, 77.2198], [28.6335, 77.2175], [28.6355, 77.2175],
  [28.6355, 77.2225], [28.6325, 77.2225], [28.6295, 77.2225], [28.6287, 77.2170],
];

function RoadLine({ from, to }: { from: [number,number]; to: [number,number] }) {
  const a = toXY(from[0], from[1]);
  const b = toXY(to[0], to[1]);
  const dx = b.x-a.x, dy = b.y-a.y;
  const len = Math.sqrt(dx*dx+dy*dy);
  const angle = Math.atan2(dy,dx)*(180/Math.PI);
  if (len < 1) return null;
  return <View style={[styles.roadLine,{left:a.x,top:a.y-1,width:len,transform:[{rotate:`${angle}deg`}]}]} />;
}

function RouteLine({ pts, color, thick }: { pts:[number,number][]; color:string; thick:boolean }) {
  const w = thick ? 5 : 3;
  return <>
    {pts.slice(0,-1).map((_,i) => {
      const a = toXY(pts[i][0],pts[i][1]);
      const b = toXY(pts[i+1][0],pts[i+1][1]);
      const dx=b.x-a.x, dy=b.y-a.y;
      const len=Math.sqrt(dx*dx+dy*dy);
      const angle=Math.atan2(dy,dx)*(180/Math.PI);
      if (len<1) return null;
      return <View key={i} style={[styles.routeLine,{left:a.x,top:a.y-w/2,width:len,height:w,backgroundColor:color,transform:[{rotate:`${angle}deg`}]}]} />;
    })}
  </>;
}

function HazardPin({ hazard, onPress }: { hazard:Hazard; onPress:()=>void }) {
  const {x,y} = toXY(hazard.lat,hazard.lon);
  const color = severityColor(hazard.severity);
  const size = hazard.severity==='S3' ? 14 : hazard.severity==='S2' ? 10 : 7;
  return (
    <TouchableOpacity style={[styles.pin,{left:x-size/2,top:y-size/2,width:size,height:size,backgroundColor:color,borderRadius:size/2}]} onPress={onPress} />
  );
}

function SectionLabel({label}:{label:string}) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}
function InfoCard({children}:{children:React.ReactNode}) {
  return <View style={styles.infoCard}>{children}</View>;
}
function InfoRow({label,value,color}:{label:string;value:string;color?:string}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue,color?{color}:null]}>{value}</Text>
    </View>
  );
}

export default function MapScreen() {
  useNearbyHazards();
  const { isDemoMode } = useDemoStore();
  const { hazards } = useHazardStore();
  const { lat, lon } = useLocationStore();

  const [activeRoute, setActiveRoute] = useState<'A'|'B'>('A');
  const [activeTab, setActiveTab] = useState<'map'|'list'>('map');
  const [selectedHazard, setSelectedHazard] = useState<Hazard|null>(null);
  const [routeStarted, setRouteStarted] = useState(false);

  const displayHazards = isDemoMode ? DEMO_HAZARDS : hazards;
  const displayLat = isDemoMode ? DEMO_LOCATION.lat : (lat ?? DEMO_LOCATION.lat);
  const displayLon = isDemoMode ? DEMO_LOCATION.lon : (lon ?? DEMO_LOCATION.lon);
  const userPos = toXY(displayLat, displayLon);
  const destPos = toXY(28.6287, 77.2170);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>HAZARD MAP</Text>
        <View style={styles.destPill}><Text style={styles.destText}>→ Saket Metro</Text></View>
      </View>
      <DemoModeBanner />

      <View style={styles.tabs}>
        {(['map','list'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab,activeTab===t&&styles.tabActive]} onPress={()=>setActiveTab(t)}>
            <Text style={[styles.tabText,activeTab===t&&styles.tabTextActive]}>
              {t==='map' ? 'MAP VIEW' : `HAZARD LIST (${displayHazards.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab==='map' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:32}}>
          {/* MAP */}
          <View style={[styles.mapCanvas,{height:MAP_H}]}>
            {ROADS.map((r,i) => <RoadLine key={i} from={r[0] as [number,number]} to={r[1] as [number,number]} />)}

            <RouteLine pts={ROUTE_A} color={activeRoute==='A' ? '#F97316' : '#F9731640'} thick={activeRoute==='A'} />
            <RouteLine pts={ROUTE_B} color={activeRoute==='B' ? '#22C55E' : '#22C55E40'} thick={activeRoute==='B'} />

            {/* Route labels */}
            {(()=>{const p=toXY(28.631,77.2205);return(
              <View style={[styles.routeTag,{left:p.x,top:p.y,backgroundColor:'#F9731622',borderColor:'#F97316'}]}>
                <Text style={[styles.routeTagText,{color:'#F97316'}]}>A</Text>
              </View>
            );})()}
            {(()=>{const p=toXY(28.636,77.2215);return(
              <View style={[styles.routeTag,{left:p.x,top:p.y,backgroundColor:'#22C55E22',borderColor:'#22C55E'}]}>
                <Text style={[styles.routeTagText,{color:'#22C55E'}]}>B</Text>
              </View>
            );})()}

            {displayHazards.map(h => <HazardPin key={h.id} hazard={h} onPress={()=>setSelectedHazard(h)} />)}

            {/* User dot */}
            <View style={[styles.userRing,{left:userPos.x-14,top:userPos.y-14}]} />
            <View style={[styles.userDot,{left:userPos.x-8,top:userPos.y-8}]} />

            {/* Dest pin */}
            <View style={{position:'absolute',left:destPos.x-10,top:destPos.y-22}}>
              <Text style={{fontSize:20}}>📍</Text>
            </View>

            <View style={styles.mapLegend}>
              <Text style={[styles.mapLegendItem,{color:'#EF4444'}]}>● S3</Text>
              <Text style={[styles.mapLegendItem,{color:'#F97316'}]}>● S2</Text>
              <Text style={[styles.mapLegendItem,{color:'#F59E0B'}]}>● S1</Text>
            </View>
            <View style={styles.coordsTag}>
              <Text style={styles.coordsText}>{displayLat.toFixed(4)}, {displayLon.toFixed(4)}</Text>
            </View>
          </View>

          {/* ROUTE CHOOSER */}
          <View style={{padding:16,gap:10}}>
            <SectionLabel label="CHOOSE ROUTE TO SAKET METRO" />
            <View style={styles.routeCards}>
              {/* Route A */}
              <TouchableOpacity style={[styles.routeCard,activeRoute==='A'&&styles.routeCardActiveA]} onPress={()=>setActiveRoute('A')}>
                <View style={styles.routeCardHeader}>
                  <View style={[styles.routeLetter,{backgroundColor:'#F97316'}]}><Text style={styles.routeLetterText}>A</Text></View>
                  <Text style={styles.routeCardLabel}>DIRECT</Text>
                  {activeRoute==='A' && <Text style={styles.activeCheck}>✓</Text>}
                </View>
                <View style={styles.routeCardStats}>
                  <View style={styles.rstat}><Text style={styles.rstatVal}>{DEMO_ROUTE_INFO.distanceKm}</Text><Text style={styles.rstatUnit}>km</Text></View>
                  <View style={styles.rstat}><Text style={styles.rstatVal}>{DEMO_ROUTE_INFO.durationMin}</Text><Text style={styles.rstatUnit}>min</Text></View>
                  <View style={styles.rstat}><Text style={[styles.rstatVal,{color:'#EF4444'}]}>3</Text><Text style={styles.rstatUnit}>hazards</Text></View>
                </View>
                <Text style={styles.routeWarning}>⚠  Passes 3 critical potholes</Text>
              </TouchableOpacity>

              {/* Route B */}
              <TouchableOpacity style={[styles.routeCard,activeRoute==='B'&&styles.routeCardActiveB]} onPress={()=>setActiveRoute('B')}>
                <View style={styles.routeCardHeader}>
                  <View style={[styles.routeLetter,{backgroundColor:'#22C55E'}]}><Text style={styles.routeLetterText}>B</Text></View>
                  <Text style={styles.routeCardLabel}>SAFE</Text>
                  {activeRoute==='B' && <Text style={[styles.activeCheck,{color:'#22C55E'}]}>✓</Text>}
                </View>
                <View style={styles.routeCardStats}>
                  <View style={styles.rstat}><Text style={[styles.rstatVal,{color:'#22C55E'}]}>{DEMO_ROUTE_INFO.safeDistanceKm}</Text><Text style={styles.rstatUnit}>km</Text></View>
                  <View style={styles.rstat}><Text style={[styles.rstatVal,{color:'#22C55E'}]}>{DEMO_ROUTE_INFO.safeDurationMin}</Text><Text style={styles.rstatUnit}>min</Text></View>
                  <View style={styles.rstat}><Text style={[styles.rstatVal,{color:'#22C55E'}]}>0</Text><Text style={styles.rstatUnit}>hazards</Text></View>
                </View>
                <Text style={styles.routeSafe}>✓  Pothole-free — recommended</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.goBtn, activeRoute==='B' ? styles.goBtnSafe : styles.goBtnWarn]}
              onPress={()=>setRouteStarted(true)}
            >
              <Text style={styles.goBtnText}>
                {routeStarted ? `✓  NAVIGATING — ROUTE ${activeRoute}` : `START — ROUTE ${activeRoute}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* POTHOLE PHOTO STRIP */}
          <SectionLabel label="RECENT DETECTIONS — POTHOLE PHOTOS" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,gap:10,paddingBottom:8}}>
            {displayHazards.filter(h=>h.severity==='S3'||h.severity==='S2').slice(0,5).map((h,i)=>(
              <TouchableOpacity key={h.id} style={styles.thumbCard} onPress={()=>setSelectedHazard(h)}>
                <PotholeImage index={i} style={{height:90,width:130}} severity={h.severity} confidence={h.confidence} />
                <Text style={styles.thumbType} numberOfLines={1}>{h.type?.replace(/_/g,' ').toUpperCase()}</Text>
                <Text style={styles.thumbCoords}>{h.lat.toFixed(4)}, {h.lon.toFixed(4)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>
      ) : (
        <FlatList
          data={displayHazards}
          keyExtractor={i=>String(i.id)}
          contentContainerStyle={{padding:16,gap:10}}
          renderItem={({item,index})=>{
            const color=severityColor(item.severity);
            return (
              <TouchableOpacity style={styles.listCard} onPress={()=>setSelectedHazard(item)}>
                <PotholeImage index={index} style={{height:80,width:100,borderRadius:6}} severity={item.severity} confidence={item.confidence} />
                <View style={styles.listCardInfo}>
                  <View style={[styles.badge,{backgroundColor:color+'22',borderColor:color}]}>
                    <Text style={[styles.badgeText,{color}]}>{item.severity}</Text>
                  </View>
                  <Text style={styles.listCardType}>{item.type?.replace(/_/g,' ').toUpperCase()}</Text>
                  <Text style={styles.listCardCoords}>{item.lat.toFixed(5)}, {item.lon.toFixed(5)}</Text>
                  <Text style={styles.listCardMeta}>{item.report_count??1} reports · {((item.confidence??0)*100).toFixed(0)}% conf</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* DETAIL MODAL */}
      <Modal visible={!!selectedHazard} transparent animationType="slide">
        <View style={styles.overlay}>
          {selectedHazard&&(()=>{
            const c=DEMO_CONTRACTORS[selectedHazard.id]??DEMO_CONTRACTORS[1];
            const color=severityColor(selectedHazard.severity);
            const idx=DEMO_HAZARDS.findIndex(h=>h.id===selectedHazard.id);
            return (
              <ScrollView style={styles.sheet}>
                <View style={styles.sheetHandle}/>
                <View style={{paddingHorizontal:16,marginBottom:12}}>
                  <PotholeImage index={idx>=0?idx:0} style={{height:160,width:'100%'}} severity={selectedHazard.severity} confidence={selectedHazard.confidence} />
                </View>
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetSev,{color}]}>{selectedHazard.severity}</Text>
                  <View>
                    <Text style={styles.sheetType}>{selectedHazard.type?.replace(/_/g,' ').toUpperCase()}</Text>
                    <Text style={styles.sheetStatus}>{selectedHazard.status}</Text>
                  </View>
                </View>
                <SectionLabel label="HAZARD INFO"/>
                <InfoCard>
                  <InfoRow label="COORDINATES" value={`${selectedHazard.lat.toFixed(5)}, ${selectedHazard.lon.toFixed(5)}`}/>
                  <InfoRow label="REPORTS" value={String(selectedHazard.report_count??1)}/>
                  <InfoRow label="CONFIDENCE" value={`${((selectedHazard.confidence??0)*100).toFixed(0)}%`}/>
                  <InfoRow label="STATUS" value={selectedHazard.status??'CONFIRMED'}/>
                </InfoCard>
                <SectionLabel label="CONTRACTOR ACCOUNTABILITY"/>
                <InfoCard>
                  <InfoRow label="CONTRACTOR" value={c.name}/>
                  <InfoRow label="CONTRACT NO." value={c.contract}/>
                  <InfoRow label="JE RESPONSIBLE" value={c.je}/>
                  <InfoRow label="ROAD QUALITY" value={`${c.score}/100`} color={c.score<40?'#EF4444':'#F59E0B'}/>
                  <InfoRow label="WARRANTY BREACH" value={`${c.breaches}×`} color="#EF4444"/>
                  <InfoRow label="UNRESOLVED" value={`${c.unresolved} days`} color="#F97316"/>
                </InfoCard>
                <SectionLabel label="ECONOMIC DAMAGE"/>
                <InfoCard>
                  <InfoRow label="TOTAL DAMAGE" value={c.totalDamage} color="#EF4444"/>
                  <InfoRow label="VEHICLE DAMAGE" value={c.vehicleDamage}/>
                  <InfoRow label="TRAFFIC COST" value={c.trafficCost} color="#F97316"/>
                </InfoCard>
                <TouchableOpacity style={[styles.mBtn,styles.mBtnPrimary,{margin:16}]} onPress={()=>setSelectedHazard(null)}>
                  <Text style={styles.mBtnText}>CLOSE</Text>
                </TouchableOpacity>
              </ScrollView>
            );
          })()}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#0A0A0A'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:52,paddingBottom:12,borderBottomWidth:1,borderBottomColor:'#1C1C1C'},
  title:{color:'#fff',fontSize:14,fontWeight:'800',letterSpacing:3,fontFamily:'monospace'},
  destPill:{backgroundColor:'#1A1A1A',borderRadius:8,paddingHorizontal:10,paddingVertical:5,borderWidth:1,borderColor:'#22C55E55'},
  destText:{color:'#22C55E',fontSize:10,fontFamily:'monospace'},
  tabs:{flexDirection:'row',borderBottomWidth:1,borderBottomColor:'#1C1C1C'},
  tab:{flex:1,paddingVertical:12,alignItems:'center'},
  tabActive:{borderBottomWidth:2,borderBottomColor:'#F97316'},
  tabText:{color:'#555',fontSize:10,fontFamily:'monospace',letterSpacing:1},
  tabTextActive:{color:'#F97316'},
  mapCanvas:{backgroundColor:'#0D1117',marginHorizontal:16,marginTop:12,marginBottom:4,borderRadius:12,overflow:'hidden',borderWidth:1,borderColor:'#1E2A3A',position:'relative'},
  roadLine:{position:'absolute',height:2,backgroundColor:'#1A2A1A'},
  routeLine:{position:'absolute',borderRadius:2},
  routeTag:{position:'absolute',width:22,height:22,borderRadius:11,alignItems:'center',justifyContent:'center',borderWidth:1},
  routeTagText:{fontSize:10,fontWeight:'800',fontFamily:'monospace'},
  pin:{position:'absolute',borderWidth:1.5,borderColor:'rgba(255,255,255,0.5)'},
  userDot:{position:'absolute',width:16,height:16,borderRadius:8,backgroundColor:'#3B82F6',borderWidth:2,borderColor:'#fff'},
  userRing:{position:'absolute',width:28,height:28,borderRadius:14,borderWidth:2,borderColor:'#3B82F655'},
  mapLegend:{position:'absolute',bottom:8,left:10,flexDirection:'row',gap:8,backgroundColor:'rgba(0,0,0,0.7)',padding:5,borderRadius:4},
  mapLegendItem:{color:'#EF4444',fontSize:9,fontFamily:'monospace'},
  coordsTag:{position:'absolute',top:8,right:10,backgroundColor:'rgba(0,0,0,0.7)',padding:4,borderRadius:4},
  coordsText:{color:'#555',fontSize:8,fontFamily:'monospace'},
  sectionLabel:{color:'#444',fontSize:9,letterSpacing:3,fontFamily:'monospace',paddingHorizontal:16,marginTop:4,marginBottom:6},
  routeCards:{flexDirection:'row',gap:10},
  routeCard:{flex:1,backgroundColor:'#111',borderRadius:10,borderWidth:1,borderColor:'#222',padding:12},
  routeCardActiveA:{borderColor:'#F97316',backgroundColor:'#1A0D00'},
  routeCardActiveB:{borderColor:'#22C55E',backgroundColor:'#001A09'},
  routeCardHeader:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:10},
  routeLetter:{width:22,height:22,borderRadius:11,alignItems:'center',justifyContent:'center'},
  routeLetterText:{color:'#fff',fontSize:11,fontWeight:'900'},
  routeCardLabel:{color:'#888',fontSize:9,fontFamily:'monospace',letterSpacing:1,flex:1},
  activeCheck:{color:'#F97316',fontSize:12,fontWeight:'700'},
  routeCardStats:{flexDirection:'row',gap:12,marginBottom:8},
  rstat:{},
  rstatVal:{color:'#fff',fontSize:18,fontWeight:'800',lineHeight:20},
  rstatUnit:{color:'#444',fontSize:8,fontFamily:'monospace',letterSpacing:1},
  routeWarning:{color:'#EF4444',fontSize:9,fontFamily:'monospace'},
  routeSafe:{color:'#22C55E',fontSize:9,fontFamily:'monospace'},
  goBtn:{borderRadius:10,padding:16,alignItems:'center',borderWidth:1,marginTop:4},
  goBtnWarn:{backgroundColor:'#1A0800',borderColor:'#F97316'},
  goBtnSafe:{backgroundColor:'#001A09',borderColor:'#22C55E'},
  goBtnText:{color:'#fff',fontFamily:'monospace',fontWeight:'700',letterSpacing:2,fontSize:11},
  thumbCard:{width:130,backgroundColor:'#111',borderRadius:8,borderWidth:1,borderColor:'#1E1E1E',overflow:'hidden'},
  thumbType:{color:'#888',fontSize:9,fontFamily:'monospace',padding:6,paddingBottom:2},
  thumbCoords:{color:'#444',fontSize:8,fontFamily:'monospace',paddingHorizontal:6,paddingBottom:6},
  listCard:{flexDirection:'row',backgroundColor:'#111',borderRadius:10,borderWidth:1,borderColor:'#1E1E1E',overflow:'hidden',gap:12},
  listCardInfo:{flex:1,paddingVertical:10,paddingRight:12,gap:4},
  badge:{alignSelf:'flex-start',paddingHorizontal:8,paddingVertical:3,borderRadius:4,borderWidth:1},
  badgeText:{fontSize:9,fontFamily:'monospace',fontWeight:'800'},
  listCardType:{color:'#ccc',fontSize:12,fontWeight:'600'},
  listCardCoords:{color:'#444',fontSize:9,fontFamily:'monospace'},
  listCardMeta:{color:'#555',fontSize:9,fontFamily:'monospace'},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.8)',justifyContent:'flex-end'},
  sheet:{backgroundColor:'#111',borderTopLeftRadius:16,borderTopRightRadius:16,borderTopWidth:1,borderColor:'#222',maxHeight:'92%'},
  sheetHandle:{width:40,height:4,backgroundColor:'#333',borderRadius:2,alignSelf:'center',marginTop:12,marginBottom:16},
  sheetHeader:{flexDirection:'row',alignItems:'center',gap:16,paddingHorizontal:16,marginBottom:16},
  sheetSev:{fontSize:52,fontWeight:'900',lineHeight:56},
  sheetType:{color:'#888',fontFamily:'monospace',fontSize:11,letterSpacing:2},
  sheetStatus:{color:'#F97316',fontFamily:'monospace',fontSize:9,letterSpacing:1,marginTop:4},
  infoCard:{backgroundColor:'#0F0F0F',borderRadius:8,borderWidth:1,borderColor:'#1E1E1E',paddingHorizontal:16,marginHorizontal:16,marginBottom:12},
  infoRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:9,borderBottomWidth:1,borderBottomColor:'#1A1A1A'},
  infoLabel:{color:'#444',fontSize:9,letterSpacing:2,fontFamily:'monospace'},
  infoValue:{color:'#ccc',fontSize:11,fontFamily:'monospace',fontWeight:'600',maxWidth:'55%',textAlign:'right'},
  mBtn:{borderRadius:10,padding:14,alignItems:'center',borderWidth:1,borderColor:'#333'},
  mBtnPrimary:{backgroundColor:'#7C2D12',borderColor:'#F97316'},
  mBtnText:{color:'#fff',fontFamily:'monospace',fontWeight:'700',fontSize:11,letterSpacing:1},
});