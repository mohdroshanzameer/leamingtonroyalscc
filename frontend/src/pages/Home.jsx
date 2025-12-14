import React from 'react';
import HeroSection from '../components/home/HeroSection';
import UpcomingMatches from '../components/home/UpcomingMatches';
import LatestNews from '../components/home/LatestNews';
import ClubStatsSection from '../components/home/ClubStatsSection';
import CallToAction from '../components/home/CallToAction';
import SponsorsSection from '../components/home/SponsorsSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <UpcomingMatches />
      <LatestNews />
      <ClubStatsSection />
      <SponsorsSection />
      <CallToAction />
    </>
  );
}