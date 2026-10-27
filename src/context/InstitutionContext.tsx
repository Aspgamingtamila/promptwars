import React, { createContext, useContext, useState, useEffect } from 'react';
import { InstitutionType, Organization } from '../types';
import { storageEngine } from '../lib/storageEngine';
import { useAuth } from './AuthContext';

interface InstitutionTerminology {
  orgName: string;
  facilityCode: string;
  subtitle: string;
  areaLabel: string;
  areaExamples: string;
  staffCategory: string;
  complianceTitle: string;
  complianceSubtitle: string;
  complianceGrade: string;
}

const TERMINOLOGY_PRESETS: Record<InstitutionType, InstitutionTerminology> = {
  school_college: {
    orgName: 'Oakridge Campus Operations',
    facilityCode: 'OKR-NORTH-04',
    subtitle: 'Real-time non-clinical staff deployment, hazard mitigation, and active handover queue.',
    areaLabel: 'Campus Work Areas & Zones',
    areaExamples: 'e.g., Classroom Block, Central Library, Science Labs, Athletics Atrium',
    staffCategory: 'Campus Facilities & Support Staff',
    complianceTitle: 'Dual-Sector Governance Protocol Active',
    complianceSubtitle: 'Tasks strictly scoped to campus maintenance, sanitation, transit logistics, and facility safety.',
    complianceGrade: 'Compliance Grade A+ (100%)'
  },
  hospital: {
    orgName: 'Metro Health Logistics & Support Center',
    facilityCode: 'MH-CENTRAL-09',
    subtitle: 'Round-the-clock non-clinical care support, environmental sanitation, and transition logs.',
    areaLabel: 'Hospital Support Areas & Transit Corridors',
    areaExamples: 'e.g., North Wing Corridors, Emergency Receiving, Sterile Supply Dock, Utility Bays',
    staffCategory: 'Environmental Logistics & Sanitation Teams',
    complianceTitle: 'Non-Clinical Operational Protocol Active',
    complianceSubtitle: 'Strict non-clinical coordination. Contains zero patient health or clinical medical records.',
    complianceGrade: 'Sanitation Audit Grade A+ (100%)'
  }
};

interface InstitutionContextType {
  institutionType: InstitutionType;
  organization: Organization;
  terminology: InstitutionTerminology;
  setInstitutionType: (type: InstitutionType) => void;
  toggleInstitutionType: () => void;
  resetAllData: () => void;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

export const InstitutionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [organization, setOrganization] = useState<Organization>(() => storageEngine.getOrganization());
  const [institutionType, setInstitutionTypeState] = useState<InstitutionType>(
    organization.institution_type || 'school_college'
  );

  const setInstitutionType = (type: InstitutionType) => {
    setInstitutionTypeState(type);
    const updated = storageEngine.updateInstitutionType(type, currentUser?.id || 'user-admin-01');
    setOrganization(updated);
  };

  const toggleInstitutionType = () => {
    const nextType: InstitutionType = institutionType === 'school_college' ? 'hospital' : 'school_college';
    setInstitutionType(nextType);
  };

  const resetAllData = () => {
    const freshState = storageEngine.resetToDefaultSeed();
    setOrganization(freshState.organization);
    setInstitutionTypeState(freshState.organization.institution_type);
  };

  const terminology = TERMINOLOGY_PRESETS[institutionType];

  return (
    <InstitutionContext.Provider
      value={{
        institutionType,
        organization,
        terminology,
        setInstitutionType,
        toggleInstitutionType,
        resetAllData
      }}
    >
      {children}
    </InstitutionContext.Provider>
  );
};

export const useInstitution = () => {
  const context = useContext(InstitutionContext);
  if (!context) {
    throw new Error('useInstitution must be used within an InstitutionProvider');
  }
  return context;
};
