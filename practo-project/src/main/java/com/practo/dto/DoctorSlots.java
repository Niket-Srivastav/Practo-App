package com.practo.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor

public class DoctorSlots {
    Long totalcount;
    List<DoctorSlotInfo> slots;
}
