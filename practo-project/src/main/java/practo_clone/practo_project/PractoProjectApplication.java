package practo_clone.practo_project;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import com.practo.config.DotenvConfig;

@SpringBootApplication(scanBasePackages = "com.practo")
@EnableJpaRepositories(basePackages = "com.practo.repository")
@EntityScan(basePackages = "com.practo.entity")
@EnableCaching
public class PractoProjectApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(PractoProjectApplication.class);
        app.addInitializers(new DotenvConfig());
        app.run(args);
    }

}
