import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsEvaluationCompleted1747122824941 implements MigrationInterface {
    name = 'AddIsEvaluationCompleted1747122824941'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_explanation\` DROP FOREIGN KEY \`FK_b088261b98f9b17866925174f8c\``);
        await queryRunner.query(`ALTER TABLE \`user_explanation\` DROP FOREIGN KEY \`FK_f3c701ef7333ca0f1ef0b8d2989\``);
        await queryRunner.query(`ALTER TABLE \`user_explanation\` CHANGE \`video_id\` \`video_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`user_explanation\` CHANGE \`user_id\` \`user_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`chat_log\` DROP FOREIGN KEY \`FK_705d9bf148cc34c669da17a0f65\``);
        await queryRunner.query(`ALTER TABLE \`chat_log\` DROP FOREIGN KEY \`FK_64ee0db20a89f4438cc34d9f221\``);
        await queryRunner.query(`ALTER TABLE \`chat_log\` CHANGE \`user_id\` \`user_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`chat_log\` CHANGE \`video_id\` \`video_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`ai_result\` DROP FOREIGN KEY \`FK_2c5fb73d81f6b01de56369daa8d\``);
        await queryRunner.query(`ALTER TABLE \`ai_result\` CHANGE \`is_evaluation_completed\` \`is_evaluation_completed\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`ai_result\` CHANGE \`video_id\` \`video_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`video\` DROP FOREIGN KEY \`FK_0c06b8d2494611b35c67296356c\``);
        await queryRunner.query(`ALTER TABLE \`video\` DROP FOREIGN KEY \`FK_cc04dfd08348cc1fbf4d09d0565\``);
        await queryRunner.query(`ALTER TABLE \`video\` CHANGE \`user_id\` \`user_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`video\` CHANGE \`ai_result_id\` \`ai_result_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`re_evaluation\` DROP FOREIGN KEY \`FK_532ade65e3bd0c48fb789d9f6aa\``);
        await queryRunner.query(`ALTER TABLE \`re_evaluation\` DROP FOREIGN KEY \`FK_3248a44fef9fc7357476298f8ae\``);
        await queryRunner.query(`ALTER TABLE \`re_evaluation\` CHANGE \`video_id\` \`video_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`re_evaluation\` CHANGE \`explanation_id\` \`explanation_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`user_explanation\` ADD CONSTRAINT \`FK_b088261b98f9b17866925174f8c\` FOREIGN KEY (\`video_id\`) REFERENCES \`video\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_explanation\` ADD CONSTRAINT \`FK_f3c701ef7333ca0f1ef0b8d2989\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat_log\` ADD CONSTRAINT \`FK_705d9bf148cc34c669da17a0f65\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat_log\` ADD CONSTRAINT \`FK_64ee0db20a89f4438cc34d9f221\` FOREIGN KEY (\`video_id\`) REFERENCES \`video\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ai_result\` ADD CONSTRAINT \`FK_2c5fb73d81f6b01de56369daa8d\` FOREIGN KEY (\`video_id\`) REFERENCES \`video\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`video\` ADD CONSTRAINT \`FK_0c06b8d2494611b35c67296356c\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`video\` ADD CONSTRAINT \`FK_cc04dfd08348cc1fbf4d09d0565\` FOREIGN KEY (\`ai_result_id\`) REFERENCES \`ai_result\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`re_evaluation\` ADD CONSTRAINT \`FK_532ade65e3bd0c48fb789d9f6aa\` FOREIGN KEY (\`video_id\`) REFERENCES \`video\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`re_evaluation\` ADD CONSTRAINT \`FK_3248a44fef9fc7357476298f8ae\` FOREIGN KEY (\`explanation_id\`) REFERENCES \`user_explanation\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`re_evaluation\` DROP FOREIGN KEY \`FK_3248a44fef9fc7357476298f8ae\``);
        await queryRunner.query(`ALTER TABLE \`re_evaluation\` DROP FOREIGN KEY \`FK_532ade65e3bd0c48fb789d9f6aa\``);
        await queryRunner.query(`ALTER TABLE \`video\` DROP FOREIGN KEY \`FK_cc04dfd08348cc1fbf4d09d0565\``);
        await queryRunner.query(`ALTER TABLE \`video\` DROP FOREIGN KEY \`FK_0c06b8d2494611b35c67296356c\``);
        await queryRunner.query(`ALTER TABLE \`ai_result\` DROP FOREIGN KEY \`FK_2c5fb73d81f6b01de56369daa8d\``);
        await queryRunner.query(`ALTER TABLE \`chat_log\` DROP FOREIGN KEY \`FK_64ee0db20a89f4438cc34d9f221\``);
        await queryRunner.query(`ALTER TABLE \`chat_log\` DROP FOREIGN KEY \`FK_705d9bf148cc34c669da17a0f65\``);
        await queryRunner.query(`ALTER TABLE \`user_explanation\` DROP FOREIGN KEY \`FK_f3c701ef7333ca0f1ef0b8d2989\``);
        await queryRunner.query(`ALTER TABLE \`user_explanation\` DROP FOREIGN KEY \`FK_b088261b98f9b17866925174f8c\``);
        await queryRunner.query(`ALTER TABLE \`re_evaluation\` CHANGE \`explanation_id\` \`explanation_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`re_evaluation\` CHANGE \`video_id\` \`video_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`re_evaluation\` ADD CONSTRAINT \`FK_3248a44fef9fc7357476298f8ae\` FOREIGN KEY (\`explanation_id\`) REFERENCES \`user_explanation\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`re_evaluation\` ADD CONSTRAINT \`FK_532ade65e3bd0c48fb789d9f6aa\` FOREIGN KEY (\`video_id\`) REFERENCES \`video\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`video\` CHANGE \`ai_result_id\` \`ai_result_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`video\` CHANGE \`user_id\` \`user_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`video\` ADD CONSTRAINT \`FK_cc04dfd08348cc1fbf4d09d0565\` FOREIGN KEY (\`ai_result_id\`) REFERENCES \`ai_result\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`video\` ADD CONSTRAINT \`FK_0c06b8d2494611b35c67296356c\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ai_result\` CHANGE \`video_id\` \`video_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`ai_result\` CHANGE \`is_evaluation_completed\` \`is_evaluation_completed\` tinyint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`ai_result\` ADD CONSTRAINT \`FK_2c5fb73d81f6b01de56369daa8d\` FOREIGN KEY (\`video_id\`) REFERENCES \`video\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat_log\` CHANGE \`video_id\` \`video_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`chat_log\` CHANGE \`user_id\` \`user_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`chat_log\` ADD CONSTRAINT \`FK_64ee0db20a89f4438cc34d9f221\` FOREIGN KEY (\`video_id\`) REFERENCES \`video\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat_log\` ADD CONSTRAINT \`FK_705d9bf148cc34c669da17a0f65\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_explanation\` CHANGE \`user_id\` \`user_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`user_explanation\` CHANGE \`video_id\` \`video_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`user_explanation\` ADD CONSTRAINT \`FK_f3c701ef7333ca0f1ef0b8d2989\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_explanation\` ADD CONSTRAINT \`FK_b088261b98f9b17866925174f8c\` FOREIGN KEY (\`video_id\`) REFERENCES \`video\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
