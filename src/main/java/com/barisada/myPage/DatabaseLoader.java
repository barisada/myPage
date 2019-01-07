package com.barisada.myPage;

import com.barisada.myPage.model.Lecture;
import com.barisada.myPage.repository.LectureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DatabaseLoader implements CommandLineRunner {
    private final LectureRepository repository;

    @Autowired
    public DatabaseLoader(LectureRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) throws Exception {
        String url1 = "https://www.youtube.com/playlist?list=PLXRLrpkaZYHYfb8cW1S2fnR_uFM55k1gs";
        this.repository.save(new Lecture("Lecutre # 1", "My first Lecture", url1,"admin", "admin", LocalDateTime.now(), LocalDateTime.now()));
        this.repository.save(new Lecture("Lecutre # 2", "My second Lecture", url1,"admin", "admin", LocalDateTime.now(), LocalDateTime.now()));
        this.repository.save(new Lecture("Lecutre # 3", "My third Lecture", url1,"admin", "admin", LocalDateTime.now(), LocalDateTime.now()));
        this.repository.save(new Lecture("Lecutre # 4", "My 4번째 Lecture", url1,"admin", "admin", LocalDateTime.now(), LocalDateTime.now()));
        this.repository.save(new Lecture("Lecutre # 5", "My fifth Lecture", url1,"admin", "admin", LocalDateTime.now(), LocalDateTime.now()));
        this.repository.save(new Lecture("Lecutre # 6", "My 6 Lecture", url1,"admin", "admin", LocalDateTime.now(), LocalDateTime.now()));
        this.repository.save(new Lecture("Lecutre # 7", "My SEVEN Lecture", url1,"admin", "admin", LocalDateTime.now(), LocalDateTime.now()));
        this.repository.save(new Lecture("Lecutre # 8", "My eighth Lecture", url1,"admin", "admin", LocalDateTime.now(), LocalDateTime.now()));
        this.repository.save(new Lecture("Lecutre # 9", "My NIN Lecture", url1,"admin", "admin", LocalDateTime.now(), LocalDateTime.now()));
        this.repository.save(new Lecture("Lecutre # 10", "My 10th Lecture", url1,"admin", "admin", LocalDateTime.now(), LocalDateTime.now()));
    }
}
