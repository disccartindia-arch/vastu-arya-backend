'use client';
import ServicePageTemplate from '../../../../components/services/ServicePageTemplate';
export default function Page() {
  return (<ServicePageTemplate
    icon="🏗️" badge="Expert Service"
    title="New Property Vastu Check"
    subtitle="Expert consultation by IVAF Certified Dr. PPS Tomar"
    description="Get expert guidance from Dr. PPS Tomar - IVAF Certified Vastu and astrology expert with 15+ years of experience and 45,000+ clients transformed across India."
    price={1999} originalPrice={2999} duration="45 minutes"
    benefits={['Expert analysis by IVAF Certified Dr. PPS Tomar','Detailed written report','Personalized remedies and guidance','30-day follow-up support','No demolition remedies','100% authentic Vedic principles']}
    process={[{step:'1',title:'Book & Share Details',desc:'Book your session and share relevant information.'},{step:'2',title:'Expert Analysis',desc:'Dr. PPS Tomar analyses your details carefully.'},{step:'3',title:'Consultation Call',desc:'Personal call with Dr. PPS Tomar to discuss findings.'},{step:'4',title:'Written Report',desc:'Receive detailed report within 48 hours.'}]}
    faqs={[{q:'How long does the consultation take?',a:'Approximately 45-60 minutes depending on complexity.'},{q:'How will I receive my report?',a:'Via email within 24-48 hours of the consultation.'},{q:'Is this available online?',a:'Yes, consultations are available via video call or phone across India and internationally.'}]}
  />);
}
