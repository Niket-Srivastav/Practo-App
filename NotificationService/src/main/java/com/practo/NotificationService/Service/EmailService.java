package com.practo.NotificationService.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.practo.NotificationService.DTO.NotificationEvent;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;
    private final TemplateEngine templateEngine;


    public void SendAppointConfirmationEmail(NotificationEvent notificationEvent) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setSubject("New Appointment Confirmed");
            helper.setTo((String) notificationEvent.getRecipientEmail());
            helper.setFrom("no-reply@practo.com");

            Context context = new Context();
            context.setVariable("doctorName", notificationEvent.getDoctorName());
            context.setVariable("patientName", notificationEvent.getPatientName());
            context.setVariable("appointmentTime", notificationEvent.getAppointmentTime());
            context.setVariable("consultationFee", notificationEvent.getConsultationFee());
            context.setVariable("appointmentId", notificationEvent.getAppointmentId());

            if(notificationEvent.getTemplateData() != null){
                notificationEvent.getTemplateData().forEach(context::setVariable);
            }

            String htmlContent = templateEngine.process("appointment-confirmation", context);
            helper.setText(htmlContent, true);

            javaMailSender.send(message);
            log.info("Appointment confirmation email sent to {}", notificationEvent.getRecipientEmail());

        } catch (Exception e) {
            log.error("Error sending appointment confirmation email to {}", notificationEvent.getRecipientEmail(), e);
            throw new RuntimeException("Failed to send email to " + notificationEvent.getRecipientEmail(), e);
        }
    }
    
}
