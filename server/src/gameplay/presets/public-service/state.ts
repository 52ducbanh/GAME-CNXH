import type { Citizen, MedicalServiceState, BridgeResponseState, CitizenRightsState } from "shared";
import { INITIAL_CITIZENS } from "shared";

export interface PublicServiceState { medicalService: MedicalServiceState; bridgeResponse: BridgeResponseState; citizenRights: CitizenRightsState; citizens: Citizen[]; }

export function createMedicalService(): MedicalServiceState {
    return {
      status: 'LOCKED',
      surveys: { A: false, B: false, C: false },
      surveyAssignedTo: {},
      planProposed: 'NONE',
      planCommitted: 'NONE',
      planVersion: 1,
      requiredCrates: 0,
      deliveredCratesFixed: 0,
      deliveredCratesMobileB: 0,
      deliveredCratesMobileC: 0,
      fixedDeployed: false,
      mobileBDeployed: false,
      mobileCDeployed: false,
      verifiedA: false,
      verifiedB: false,
      verifiedC: false,
      noticePublished: false,
      score: 0
    };
  }

export function createBridgeResponse(): BridgeResponseState {
    return {
      status: 'LOCKED',
      bridgeBroken: false,
      bridgeRepaired: false,
      surveyDone: false,
      planProposed: 'NONE',
      planCommitted: 'NONE',
      planVersion: 1,
      bridgeCratesDelivered: 0,
      bridgeRepairTask1: false,
      bridgeRepairTask2: false,
      reliefCratesDeliveredB: 0,
      verifiedB: false,
      noticePublished: false,
      score: 0
    };
  }

export function createCitizenRights(): CitizenRightsState {
    return {
      status: 'LOCKED',
      receivedFeedbackC: false,
      crossCheckedList: false,
      planConfirmed: false,
      deliveredC1: false,
      deployedC1: false,
      deliveredC2: false,
      deployedC2: false,
      lossAuditDone: false,
      lossAuditConclusion: 'Chưa đối chiếu sổ sách',
      noticePublished: false,
      score: 0
    };
  }

export function createCitizens(): Citizen[] {
    const citizens: Citizen[] = [];
    // Zone A: 12
    for (let i = 1; i <= INITIAL_CITIZENS.ZONE_A; i++) {
      citizens.push({
        id: `A${i}`,
        name: `Người dân A-${i}`,
        zone: 'A',
        served: false
      });
    }
    // Zone B: 10
    for (let i = 1; i <= INITIAL_CITIZENS.ZONE_B; i++) {
      citizens.push({
        id: `B${i}`,
        name: `Người dân B-${i}`,
        zone: 'B',
        served: false
      });
    }
    // Zone C: 8 (C1 & C2 special needs)
    citizens.push({
      id: 'C1',
      name: 'Cụ C1 (Khó khăn vận động)',
      zone: 'C',
      isSpecialNeeds: true,
      served: false
    });
    citizens.push({
      id: 'C2',
      name: 'Cụ C2 (Người cao tuổi neo đơn)',
      zone: 'C',
      isSpecialNeeds: true,
      served: false
    });
    for (let i = 3; i <= INITIAL_CITIZENS.ZONE_C; i++) {
      citizens.push({
        id: `C${i}`,
        name: `Người dân C-${i}`,
        zone: 'C',
        served: false
      });
    }
  
 return citizens;
}
export function createPublicServiceState(): PublicServiceState { return { medicalService:createMedicalService(), bridgeResponse:createBridgeResponse(), citizenRights:createCitizenRights(), citizens:createCitizens() }; }
