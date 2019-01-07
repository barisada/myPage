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
        Lecture lecture1 = new Lecture("Lecutre # 1",
                "My first Lecture",
                "https://www.youtube.com/playlist?list=PLXRLrpkaZYHYfb8cW1S2fnR_uFM55k1gs",
                "admin", "admin", LocalDateTime.now(), LocalDateTime.now());
        this.repository.save(lecture1);
    }
}
