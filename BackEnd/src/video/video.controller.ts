import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Body } from '@nestjs/common';
import { VideoService } from './video.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';

@Controller('video')
@UseGuards(AuthGuard('jwt'))
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/videos',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      }
    })
  }))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: number,
    @Body('ai_result_id') aiResultId: number,
  ) {
    return this.videoService.saveVideo(file, userId, aiResultId);
  }
}
