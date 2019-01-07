package com.barisada.myPage.model;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import java.time.LocalDateTime;

@Data
@Entity
public class Lecture {

    @Id @GeneratedValue
    private Long id;
    private String title;
    private String description;
    private String url;
    private String creator;
    private String updator;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Lecture(){}

    public Lecture(String title, String description, String url, String creator, String updator, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.title = title;
        this.description = description;
        this.url = url;
        this.creator = creator;
        this.updator = updator;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
