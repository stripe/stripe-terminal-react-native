//
//  Created by Alex Wong on 2023-01-05.
//  Copyright © 2023 BBPOS International Limited. All rights reserved. All software, both binary and source code published by BBPOS International Limited (hereafter BBPOS) is copyrighted by BBPOS and ownership of all right, title and interest in and to the software remains with BBPOS.
//  RESTRICTED DOCUMENT
//

// *** Important Notes: This file require to in-sync with CH3_DriverKit_USBController_DataStruct ***

#include <os/log.h>
#include <stdint.h>
#include <stdio.h>

#ifndef BBUSBDriverDataStruct_h
#define BBUSBDriverDataStruct_h

// ---------------------------------------------------------------------------------------------------------------------------

#define kDriver_DataStructSize_Max 127
#define kDriver_DataStructSize_Write 120
#define kDriver_DataStructSize_Read 120
#define kDriver_PacketSize_ControlEp 129
#define kDriver_PacketSize_InterruptEp 128
#define kDriver_PacketSize_CheckDeviceEpSupportiveness 100

const uint32_t kClientExternalMethodSelector_OpenUSBInterface = 1000;
const uint32_t kClientExternalMethodSelector_CloseUSBInterface = 1001;
const uint32_t kClientExternalMethodSelector_ReleaseCallbackAction_General = 1102;
const uint32_t kClientExternalMethodSelector_CheckEpSupportiveness = 1005; // [CheckEpSupportiveness]
const uint32_t kClientExternalMethodSelector_USBDataComm_FillWriteBuffer = 1500;
const uint32_t kClientExternalMethodSelector_USBDataComm_Write = 1501;
const uint32_t kClientExternalMethodSelector_USBDataComm_Read = 1601;
const uint32_t kClientExternalMethodSelector_USBDataComm_InterruptEp_ClearBuffer_Read = 1603; // [InterruptEp_ClearBuffer_Read]
const uint32_t kClientExternalMethodSelector_USBDataComm_ReleaseReadCallbackAction = 1602;

const uint32_t kClientExternalMethodSelector_GetDriverVersion = 1700; // [GetDriverVersion]
const uint32_t kClientExternalMethodSelector_ReturnDriverDebugLog = 1701;

const uint8_t kUserClientActionType_ConnectUserClient_DriverDetection = 100;
const uint8_t kUserClientActionType_ConnectUserClient_USBClient = 101;
const uint8_t kUserClientActionType_OpenUSBInterface = 102;
const uint8_t kUserClientActionType_CloseUSBInterface = 200;
const uint8_t kUserClientActionType_CheckEpSupportiveness = 105; // [CheckEpSupportiveness]
const uint8_t kUserClientActionType_DriverStatus = 111;
const uint8_t kUserClientActionType_General = 112;
const uint8_t kUserClientActionType_FillWriteBuffer = 150;
const uint8_t kUserClientActionType_Write = 151;
const uint8_t kUserClientActionType_Read = 160;
const uint8_t kUserClientActionType_USBDataComm_InterruptEp_ClearBuffer_Read = 163; // [InterruptEp_ClearBuffer_Read]
const uint8_t kUserClientActionType_ReleaseReadCallbackAction = 161;

typedef struct {
    uint64_t statusCode;
    uint64_t resultValue;
} DataStruct_Status;

typedef struct {
    u_int8_t actionType;
} DataStruct_ReleaseCallbackAction_General;

typedef struct {
    char byteArray[kDriver_DataStructSize_Max];
} DataStruct_DriverStatus;

// [GetDriverVersion]
typedef struct {
    char byteArray[kDriver_DataStructSize_Max];
} DataStruct_GetDriverVersion;

// [CheckEpSupportiveness]
typedef struct {
    u_int8_t info_1;
    u_int8_t info_2;
} DataStruct_CheckEpSupportiveness;

typedef struct {
    char byteArray[kDriver_DataStructSize_Max];
} DataStruct_ByteArray;

typedef struct {
    u_int8_t index;
    u_int8_t length;
    u_int8_t blockIndex;
    unsigned char byteArray[kDriver_DataStructSize_Write];
} DataStruct_USBDataComm_FillWriteBuffer;

typedef struct {
    u_int8_t index;
    u_int8_t length;
    u_int8_t blockIndex;
    u_int8_t totalNumberOfBlocks;
    unsigned char byteArray[kDriver_DataStructSize_Read];
} DataStruct_USBDataComm_Read;

// ---------------------------------------------------------------------------------------------------------------------------

#endif // BBUSBDriverDataStruct_h
